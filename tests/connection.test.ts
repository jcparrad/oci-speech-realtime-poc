import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpeechConnection, websocketUrl } from '../src/client/connection.ts';

class SyntheticSocket {
  static OPEN = 1;
  static last: SyntheticSocket;
  readyState = 1;
  bufferedAmount = 0;
  frames: unknown[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  url: string;
  constructor(url: string) { this.url = url; SyntheticSocket.last = this; }
  send(data: unknown) { this.frames.push(data); }
  close() { this.readyState = 3; }
}

test('direct socket uses AUTO and emits auth, PCM and final request in order without URL secrets', async () => {
  const original = globalThis.WebSocket;
  globalThis.WebSocket = SyntheticSocket as unknown as typeof WebSocket;
  try {
    const results: unknown[] = [], errors: string[] = [];
    const connection = new SpeechConnection(x => results.push(x), x => errors.push(x));
    const token = { token: 'synthetic-secret', sessionId: 'synthetic', compartmentId: 'synthetic-compartment' };
    const opened = connection.open(token);
    const socket = SyntheticSocket.last;
    socket.onopen!();
    assert.equal(token.token, '');
    const url = new URL(socket.url);
    assert.equal(url.searchParams.get('punctuation'), 'AUTO');
    assert.equal(url.searchParams.get('stabilizePartialResults'), 'MEDIUM');
    assert.equal(url.searchParams.get('encoding'), 'audio/raw;rate=16000');
    assert.equal(websocketUrl().includes('synthetic-secret'), false);
    socket.onmessage!({ data: '{"event":"CONNECT"}' }); await opened;
    const pcm = new ArrayBuffer(3200); connection.sendAudio(pcm);
    await connection.requestFinal();
    assert.equal(JSON.parse(socket.frames[0] as string).authenticationType, 'TOKEN');
    assert.equal(socket.frames[1], pcm);
    assert.deepEqual(JSON.parse(socket.frames[2] as string), { event: 'SEND_FINAL_RESULT' });
    socket.onmessage!({ data: '{"event":"RESULT","transcriptions":[]}' });
    assert.equal(results.length, 1); assert.equal(errors.length, 0);
    socket.bufferedAmount = 320001;
    assert.throws(() => connection.sendAudio(pcm), /acumula/);
    connection.close();
    assert.equal(socket.readyState, 3); assert.equal(socket.onmessage, null);
  } finally { globalThis.WebSocket = original; }
});

test('cancelled connection rejects pending setup and removes callbacks', async () => {
  const original = globalThis.WebSocket;
  globalThis.WebSocket = SyntheticSocket as unknown as typeof WebSocket;
  try {
    const connection = new SpeechConnection(() => {}, () => { throw new Error('Unexpected callback'); });
    const opened = connection.open({ token: 'synthetic', sessionId: 'synthetic', compartmentId: 'synthetic' });
    connection.close();
    await assert.rejects(opened, /cancelada/);
    assert.equal(SyntheticSocket.last.onopen, null);
  } finally { globalThis.WebSocket = original; }
});
