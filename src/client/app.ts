import { Microphone } from './audio.ts';
import { SpeechConnection } from './connection.ts';
import { Transcript, safeResult } from '../shared/transcript.ts';
import { finalizationConfirmed } from '../shared/drain.ts';
import type { SessionToken } from '../shared/settings.ts';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const start = el<HTMLButtonElement>('start'), stop = el<HTMLButtonElement>('stop');
const clear = el<HTMLButtonElement>('clear');
let transcript = new Transcript();
let connection: SpeechConnection | undefined, microphone: Microphone | undefined;
let controller: AbortController | undefined;
let configured = false;
let phase: 'idle' | 'starting' | 'recording' | 'stopping' = 'idle';
let run = 0, startedAt = 0, finalTextBeforeRun = '';
let events: unknown[] = [];

function status(text: string, error = false) {
  el('status').textContent = text;
  el('status').dataset.error = String(error);
}
function controls(next: typeof phase) {
  phase = next;
  start.disabled = phase !== 'idle';
  stop.disabled = phase !== 'recording' && phase !== 'starting';
  clear.disabled = phase !== 'idle';
  el('live-dot').classList.toggle('active', phase === 'recording');
  el('session-state').textContent = { idle: 'En espera', starting: 'Conectando', recording: 'Escuchando', stopping: 'Finalizando' }[phase];
}
function render() {
  const combined = [finalTextBeforeRun, transcript.finalText].filter(Boolean).join(' ');
  el('final').textContent = combined;
  el('empty').hidden = Boolean(combined || transcript.partialText);
  el('partial').textContent = transcript.partialText;
  el('characters').textContent = String(combined.length);
  el('segments').textContent = String(transcript.finalCount);
}
function receive(value: unknown) {
  const safe = safeResult(value);
  if (!safe) return;
  transcript.accept(safe.transcriptions); render();
  events.unshift({ receivedAt: new Date().toISOString(), ...safe });
  events = events.slice(0, 60);
  el('events').textContent = JSON.stringify(events, null, 2);
  el('event-count').textContent = String(events.length);
}
function fail(text: string) {
  ++run; controller?.abort();
  microphone?.dispose(); connection?.close();
  status(text, true); controls('idle');
}
start.addEventListener('click', async () => {
  if (!configured || phase !== 'idle') return;
  if (transcript.hasPending) { status('Hay texto provisional sin confirmar. Revísalo y usa Limpiar antes de otra prueba.', true); return; }
  finalTextBeforeRun = [finalTextBeforeRun, transcript.finalText].filter(Boolean).join(' ');
  transcript = new Transcript(); render();
  events = []; el('events').textContent = '[]'; el('event-count').textContent = '0';
  startedAt = Date.now(); const thisRun = ++run;
  controls('starting'); status('Preparando micrófono y autorización…');
  try {
    connection = new SpeechConnection(receive, text => fail(text));
    const activeConnection = connection;
    microphone = new Microphone(buffer => {
      try { activeConnection.sendAudio(buffer); } catch (error) { fail((error as Error).message); }
    });
    await microphone.prepare();
    if (thisRun !== run) return;
    controller = new AbortController();
    const timer = setTimeout(() => controller?.abort(), 20000);
    let response: Response;
    try {
      response = await fetch('/api/speech/session', { method: 'POST', headers: {
        'Content-Type': 'application/json', 'X-Speech-PoC': '1',
      }, body: '{}', signal: controller.signal });
    } finally { clearTimeout(timer); }
    const payload = await response.json();
    if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'No se obtuvo autorización.');
    if (typeof payload.token !== 'string' || typeof payload.compartmentId !== 'string') throw new Error('Respuesta de autorización inválida.');
    if (thisRun !== run) return;
    await connection.open(payload as SessionToken);
    if (thisRun !== run) return;
    microphone.start(); startedAt = Date.now(); controls('recording'); status('Habla con naturalidad. La puntuación se añade automáticamente.');
  } catch (error) {
    if (thisRun !== run) return;
    const name = error instanceof Error ? error.name : '';
    fail(name === 'NotAllowedError' ? 'Permite el micrófono en el navegador y vuelve a iniciar.' :
      name === 'NotFoundError' ? 'No se encontró un micrófono disponible.' :
      name === 'AbortError' ? 'La autorización superó el tiempo de espera. Intenta otra sesión.' :
      error instanceof Error ? error.message : 'No se pudo iniciar el dictado.');
  }
});

stop.addEventListener('click', async () => {
  if (phase === 'starting') { fail('Inicio cancelado. Puedes volver a intentarlo.'); return; }
  if (phase !== 'recording') return;
  const thisRun = run;
  controls('stopping'); status('Micrófono detenido. Esperando resultados finales…');
  try {
    const flushed = await microphone!.stop();
    if (thisRun !== run) return;
    if (!flushed) throw new Error('No se confirmó el envío del último bloque de audio. Revisa el texto.');
    const before = transcript.finalCount;
    await connection!.requestFinal();
    await new Promise(resolve => setTimeout(resolve, 5000));
    if (thisRun !== run) return;
    connection?.close();
    const confirmed = finalizationConfirmed(transcript, before);
    status(confirmed ? 'Dictado detenido. Se recibió resultado final; revisa el texto.' :
      'Dictado detenido sin confirmación final adicional. Revisa el último fragmento y cualquier texto provisional.', !confirmed);
    controls('idle');
  } catch { if (thisRun === run) fail('No se pudo confirmar el cierre completo. Revisa el último texto antes de continuar.'); }
});

clear.addEventListener('click', () => {
  if (phase !== 'idle') return;
  transcript = new Transcript(); finalTextBeforeRun = ''; events = []; render();
  el('events').textContent = '[]'; el('event-count').textContent = '0';
  el('elapsed').textContent = '00:00'; status('Texto y eventos eliminados de esta vista.');
});
setInterval(() => {
  if (phase === 'recording' || phase === 'stopping') {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    el('elapsed').textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    if (seconds >= 300 && phase === 'recording') stop.click();
  }
}, 250);
window.addEventListener('pagehide', () => { ++run; controller?.abort(); microphone?.dispose(); connection?.close(); });

controls('idle'); start.disabled = true;
fetch('/api/config').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(config => {
  if (config?.mode !== 'live') throw new Error('Configuración de servidor incompatible.');
  configured = true;
  el('mode').textContent = 'Dictado con OCI';
  el('mode-note').textContent = 'El audio se envía a OCI Speech al iniciar. Usa un texto ficticio para la prueba.';
  status('Servidor local disponible. Pulsa Iniciar dictado para conectar con OCI.'); start.disabled = false;
}).catch(() => {
  configured = false; start.disabled = true;
  el('mode').textContent = 'Sin conexión preparada';
  status('No se pudo cargar una configuración compatible. Reinicia el servidor actualizado y recarga la página.', true);
});
