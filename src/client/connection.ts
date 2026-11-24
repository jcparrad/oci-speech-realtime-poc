import {
  RealtimeParametersModelDomainEnum, RealtimeParametersPunctuationEnum,
  RealtimeParametersStabilizePartialResultsEnum, RealtimeMessageOutEventEnum,
  type RealtimeMessageAuthenticationToken,
} from '@oracle/oci-ai-speech-realtime-web';
import { settings, speechEndpoint, type SessionToken } from '../shared/settings.ts';

export function websocketUrl(): string {
  const query = new URLSearchParams({ ...Object.fromEntries(Object.entries(settings).filter(([k]) => k !== 'region')),
    modelDomain: RealtimeParametersModelDomainEnum.GENERIC,
    punctuation: RealtimeParametersPunctuationEnum.AUTO,
    stabilizePartialResults: RealtimeParametersStabilizePartialResultsEnum.MEDIUM,
    isAckEnabled: 'false',
  } as Record<string, string>);
  return `${speechEndpoint}?${query}`;
}

export class SpeechConnection {
  private socket?: WebSocket;
  private intentional = false;
  private cancelOpen?: () => void;
  private onResult: (value: unknown) => void;
  private onFailure: (text: string) => void;
  constructor(onResult: (value: unknown) => void, onFailure: (text: string) => void) {
    this.onResult = onResult; this.onFailure = onFailure;
  }

  open(value: SessionToken): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.socket = new WebSocket(websocketUrl());
      let ready = false;
      const fail = (text: string) => {
        if (!ready) reject(new Error(text)); else if (!this.intentional) this.onFailure(text);
      };
      const timer = setTimeout(() => {
        fail('OCI no confirmó la conexión en 15 segundos.'); this.close();
      }, 15000);
      this.cancelOpen = () => { clearTimeout(timer); if (!ready) reject(new Error('Conexión cancelada.')); };
      socket.onopen = () => {
        const payload: RealtimeMessageAuthenticationToken = {
          authenticationType: 'TOKEN', token: value.token, compartmentId: value.compartmentId,
        };
        socket.send(JSON.stringify(payload));
        // The SDK payload is only held until authentication is sent; never log it.
        value.token = '';
      };
      socket.onmessage = event => {
        if (typeof event.data !== 'string' || event.data.length > 200000) return;
        let data: Record<string, unknown>;
        try { data = JSON.parse(event.data); } catch { fail('OCI envió un evento no interpretable.'); return; }
        if (!data || typeof data !== 'object') return;
        if (data.event === 'CONNECT' && !ready) {
          ready = true; clearTimeout(timer); resolve();
        } else if (data.event === 'RESULT') this.onResult(data);
        else if (data.event === 'ERROR') {
          const code = typeof data.code === 'number' ? ` (${data.code})` : '';
          fail(`OCI informó un error de sesión${code}. Revisa autorización, región o cuota.`);
        }
      };
      socket.onerror = () => { fail('Falló el WebSocket. Revisa red, proxy y acceso a OCI.'); clearTimeout(timer); };
      socket.onclose = () => {
        clearTimeout(timer);
        if (!this.intentional) fail('La conexión se cerró. El audio no se reenviará automáticamente.');
      };
    });
  }
  sendAudio(buffer: ArrayBuffer): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) throw new Error('Se perdió la conexión de audio.');
    if (socket.bufferedAmount > 320000) throw new Error('La red acumula demasiado audio. Se detuvo la captura.');
    socket.send(buffer);
  }
  async requestFinal(): Promise<void> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) throw new Error('No hay conexión para finalizar.');
    // Preserve ordering: flush all locally queued binary packets before SEND_FINAL_RESULT.
    const until = Date.now() + 2500;
    while (socket.bufferedAmount && Date.now() < until) await new Promise(r => setTimeout(r, 25));
    if (socket.readyState !== WebSocket.OPEN || socket.bufferedAmount) throw new Error('La red no terminó de enviar el audio.');
    socket.send(JSON.stringify({ event: RealtimeMessageOutEventEnum.SEND_FINAL_RESULT }));
  }
  close(): void {
    this.intentional = true; this.cancelOpen?.();
    if (this.socket) {
      this.socket.onmessage = null; this.socket.onerror = null; this.socket.onclose = null; this.socket.onopen = null;
      this.socket.close();
    }
  }
}
