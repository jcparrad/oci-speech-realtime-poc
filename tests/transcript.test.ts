import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Transcript, safeResult, type Segment } from '../src/shared/transcript.ts';
import { finalizationConfirmed } from '../src/shared/drain.ts';
const s = (text: string, final = false, start = 0): Segment => ({
  transcription: text, isFinal: final, startTimeInMs: start, endTimeInMs: start + 1500,
});

test('replaces cumulative partials, consolidates once, ignores stale partial and preserves order', () => {
  const t = new Transcript();
  t.accept([s('Buenos'), s('Buenos días.')]);
  assert.equal(t.partialText, 'Buenos días.');
  assert.equal(t.finalText, '');
  t.accept([s('Buenos días.', true), s('Buenos días.', true), s('Buenos')]);
  t.accept([s('Mi celular.', true, 5000), s('Me quitaron', true, 2000)]);
  assert.equal(t.finalText, 'Buenos días. Me quitaron Mi celular.');
  assert.equal(t.partialText, '');
  assert.equal(t.finalCount, 3);
});

test('late final completes pending fragment; a timeout alone never confirms drain', () => {
  const t = new Transcript();
  t.accept([s('Texto provisional')]);
  const before = t.finalCount;
  assert.equal(finalizationConfirmed(t, before), false);
  t.accept([s('Texto final.', true)]);
  assert.equal(finalizationConfirmed(t, before), true);
  t.accept([s('Otra frase', false, 2000)]);
  assert.equal(finalizationConfirmed(t, before), false);
});

test('viewer uses an allowlist and drops authentication and extra fields', () => {
  assert.equal(safeResult({ event: 'CONNECT', token: 'synthetic-secret' }), null);
  const safe = safeResult({ event: 'RESULT', token: 'synthetic-secret',
    transcriptions: [{ ...s('<script>texto literal</script>', true), authorization: 'synthetic-secret' }] });
  assert.ok(safe);
  assert.equal(JSON.stringify(safe).includes('synthetic-secret'), false);
  assert.equal(safe.transcriptions[0].transcription, '<script>texto literal</script>');
});

test('invalid offsets do not alter consolidated transcript', () => {
  const t = new Transcript();
  t.accept([{ ...s('invalid', true), startTimeInMs: -1 }]);
  assert.equal(t.finalText, '');
});
