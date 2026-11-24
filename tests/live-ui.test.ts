import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

// Browser boundaries are replaced only in this test bundle. No microphone or OCI access.
const result = await build({ entryPoints: ['src/client/app.ts'], bundle: true, platform: 'browser',
  format: 'iife', target: 'es2022', write: false, plugins: [{
    name: 'test-browser-boundaries', setup(builder) {
      builder.onResolve({ filter: /^\.\/(audio|connection)\.ts$/ }, args =>
        args.importer.endsWith('/client/app.ts') ? { path: args.path, namespace: 'test-only' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'test-only' }, args => ({ contents: args.path === './audio.ts' ? `
        export class Microphone {
          async prepare() { globalThis.io.calls.push('microphone.prepare'); if (globalThis.io.micError) throw globalThis.io.micError; }
          start() { globalThis.io.calls.push('microphone.start'); }
          dispose() { globalThis.io.calls.push('microphone.dispose'); }
        }` : `
        export class SpeechConnection {
          constructor(receive) { globalThis.io.receive = receive; }
          async open() { globalThis.io.calls.push('websocket.open'); await globalThis.io.connected; }
          close() { globalThis.io.calls.push('websocket.close'); }
        }` }));
    },
  }] });

async function fixture(mode: unknown = 'live', micError?: Error, tokenError = false) {
  const elements = new Map<string, any>();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, {
      textContent: '', disabled: false, hidden: false, dataset: {}, classList: { toggle() {} },
      listeners: new Map<string, () => unknown>(),
      addEventListener(name: string, fn: () => unknown) { this.listeners.set(name, fn); },
      async click() { if (!this.disabled) await this.listeners.get('click')?.(); },
    });
    return elements.get(id);
  };
  let connect!: () => void;
  const io = { calls: [] as string[], micError, receive: (_value: unknown) => {},
    connected: new Promise<void>(resolve => { connect = resolve; }) };
  runInNewContext(result.outputFiles[0].text, {
    io, Error, Date, AbortController, setTimeout, clearTimeout, setInterval() { return 0; },
    document: { getElementById: element }, window: { addEventListener() {} },
    async fetch(path: string) {
      io.calls.push(path);
      if (path === '/api/config') return { ok: true, async json() { return { mode }; } };
      assert.equal(path, '/api/speech/session');
      return { ok: !tokenError, async json() { return tokenError ? { error: 'Autorización rechazada.' } :
        { token: 'synthetic-not-a-jwt', compartmentId: 'synthetic' }; } };
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { element, io, connect };
}

test('dictation waits for microphone, token and connection; only received results become text', async () => {
  const f = await fixture();
  assert.equal(f.element('start').disabled, false);
  assert.equal(f.element('final').textContent, '');
  const starting = f.element('start').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.element('session-state').textContent, 'Conectando');
  assert.equal(f.element('final').textContent, '');
  assert.equal(f.io.calls.includes('microphone.start'), false);
  f.connect(); await starting;
  assert.deepEqual(f.io.calls, ['/api/config', 'microphone.prepare', '/api/speech/session', 'websocket.open', 'microphone.start']);
  assert.equal(f.element('session-state').textContent, 'Escuchando');
  const segment = { transcription: 'Frase recibida del servicio.', startTimeInMs: 0, endTimeInMs: 1000 };
  f.io.receive({ event: 'RESULT', transcriptions: [{ ...segment, isFinal: false }] });
  assert.equal(f.element('partial').textContent, segment.transcription);
  assert.equal(f.element('final').textContent, '');
  f.io.receive({ event: 'RESULT', transcriptions: [{ ...segment, isFinal: true }] });
  assert.equal(f.element('final').textContent, segment.transcription);
  assert.equal(f.element('partial').textContent, '');
});

test('unsupported or missing server mode leaves dictation disabled without a fallback', async () => {
  for (const mode of ['unsupported', null, {}]) {
    const f = await fixture(mode);
    assert.equal(f.element('start').disabled, true);
    await f.element('start').click();
    assert.equal(f.element('final').textContent, '');
    assert.deepEqual(f.io.calls, ['/api/config']);
  }
});

test('denied microphone permission stops before token and connection, with no generated text', async () => {
  const f = await fixture('live', Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
  await f.element('start').click();
  assert.match(f.element('status').textContent, /Permite el micrófono/);
  assert.equal(f.element('final').textContent, '');
  assert.equal(f.io.calls.includes('/api/speech/session'), false);
  assert.equal(f.io.calls.includes('microphone.dispose'), true);
});

test('authorization errors release the microphone without opening a connection or generating text', async () => {
  const f = await fixture('live', undefined, true);
  await f.element('start').click();
  assert.equal(f.element('status').textContent, 'Autorización rechazada.');
  assert.equal(f.element('final').textContent, '');
  assert.equal(f.io.calls.includes('websocket.open'), false);
  assert.equal(f.io.calls.includes('microphone.dispose'), true);
});
