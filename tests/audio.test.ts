import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('worklet emits PCM16 LE, clips amplitudes and flushes the last fraction before stopping', () => {
  let Processor: any;
  const messages: any[] = [];
  class FakeAudioWorkletProcessor { port = { onmessage: undefined as any, postMessage: (m: unknown) => messages.push(m) }; }
  runInNewContext(readFileSync(new URL('../src/client/audio-worklet.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor: FakeAudioWorkletProcessor,
    registerProcessor: (_name: string, value: unknown) => { Processor = value; },
  });
  const p = new Processor();
  p.port.onmessage({ data: 'start' });
  p.process([[new Float32Array([-2, -1, 0, 1, 2])]]);
  assert.equal(messages.length, 0);
  p.port.onmessage({ data: 'stop' });
  const view = new DataView(messages[0].buffer);
  assert.deepEqual(Array.from({ length: 5 }, (_, i) => view.getInt16(i * 2, true)), [-32768, -32768, 0, 32767, 32767]);
  assert.equal(messages[1].type, 'flushed');
  assert.equal(p.process([[]]), false);
});
