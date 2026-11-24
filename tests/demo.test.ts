import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

test('demo UI consolidates fixtures and clears them without using microphone, token API or WebSocket', async () => {
  const result = await build({ entryPoints: ['src/client/app.ts'], bundle: true, platform: 'browser',
    format: 'iife', target: 'es2022', write: false });
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
  const timers: (() => void)[] = [];
  const requests: string[] = [];
  runInNewContext(result.outputFiles[0].text, {
    console, Date, URLSearchParams, setInterval() { return 0; },
    setTimeout(fn: () => void) { timers.push(fn); return timers.length; }, clearTimeout() {},
    document: { getElementById: element },
    window: { addEventListener() {} },
    navigator: { mediaDevices: { getUserMedia() { throw new Error('MICROPHONE FORBIDDEN IN DEMO'); } } },
    WebSocket: class { constructor() { throw new Error('WEBSOCKET FORBIDDEN IN DEMO'); } },
    async fetch(path: string) {
      requests.push(path); assert.equal(path, '/api/config');
      return { ok: true, async json() { return { mode: 'demo' }; } };
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(element('start').disabled, false);
  await element('start').click();
  for (const tick of timers) tick();
  assert.equal(element('partial').textContent, '');
  assert.equal(element('final').textContent, 'Buenos días. Vamos a organizar una reunión. La reunión será el martes a las diez de la mañana.');
  assert.equal(element('segments').textContent, '2');
  assert.equal(element('start').disabled, false);
  await element('clear').click();
  assert.equal(element('final').textContent, '');
  assert.equal(element('events').textContent, '[]');
  assert.deepEqual(requests, ['/api/config']);
});
