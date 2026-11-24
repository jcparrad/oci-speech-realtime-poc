import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { once } from 'node:events';
import { makeServer } from '../src/server/http.ts';

async function fixture(issue: () => Promise<{ token: string; sessionId: string; compartmentId: string }>) {
  const options = { port: 0, publicDir: '/synthetic/no-static-files', issue };
  const server = makeServer(options);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  options.port = (server.address() as { port: number }).port;
  const host = `127.0.0.1:${options.port}`;
  const call = (path: string, custom: Record<string, string> = {}, body = '{}', method = 'POST') => new Promise<{ status: number; text: string; cache: string | undefined }>((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: options.port, method, path,
      headers: { host, origin: `http://${host}`, 'x-speech-poc': '1', 'content-type': 'application/json', ...custom } }, res => {
      let text = ''; res.setEncoding('utf8'); res.on('data', x => { text += x; });
      res.on('end', () => resolve({ status: res.statusCode!, text, cache: res.headers['cache-control'] }));
    });
    req.on('error', error => reject(new Error(`Local fixture ${method} ${path}: ${error.message}`)));
    req.end(method === 'GET' ? undefined : body);
  });
  return { call, close: () => new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())) };
}
const token = { token: 'synthetic-not-a-jwt', sessionId: 'synthetic', compartmentId: 'synthetic' };

test('local origin, host, method and body checks prevent issuing tokens', async () => {
  let calls = 0;
  const f = await fixture(async () => { calls++; return token; });
  try {
    const rejectedHeaders: Record<string, string>[] = [{ origin: 'https://external.invalid' }, { host: 'external.invalid' }, { 'x-speech-poc': '' }];
    for (const headers of rejectedHeaders) {
      assert.equal((await f.call('/api/speech/session', headers)).status, 403);
    }
    assert.equal((await f.call('/api/speech/session', {}, '{}', 'GET')).status, 405);
    assert.equal((await f.call('/api/speech/session', {}, '{"region":"other"}')).status, 400);
    assert.equal((await f.call('/api/speech/session', {}, 'x'.repeat(129))).status, 413);
    assert.equal(calls, 0);
    const success = await f.call('/api/speech/session');
    assert.equal(success.status, 200); assert.equal(success.cache, 'no-store'); assert.equal(calls, 1);
    assert.equal((await f.call('/api/speech/session')).status, 429);
  } finally { await f.close(); }
});
test('configuration does not issue tokens and arbitrary private paths are not served', async () => {
  let calls = 0;
  const f = await fixture(async () => { calls++; return token; });
  try {
    for (const path of ['/.env', '/.secrets/oci/config', '/package.json']) {
      assert.equal((await f.call(path, {}, '', 'GET')).status, 404);
    }
    const config = await f.call('/api/config', {}, '', 'GET');
    assert.equal(JSON.parse(config.text).mode, 'live');
    assert.equal(JSON.parse(config.text).settings.punctuation, 'AUTO');
    assert.equal(config.text.includes('synthetic-not-a-jwt'), false);
    assert.equal(calls, 0);
  } finally { await f.close(); }
});
test('SDK errors are replaced with safe messages instead of serialized credentials', async () => {
  const f = await fixture(async () => { throw { statusCode: 403, token: 'synthetic-secret', headers: { authorization: 'synthetic-secret' } }; });
  try {
    const response = await f.call('/api/speech/session');
    assert.equal(response.status, 502);
    assert.match(response.text, /403/);
    assert.equal(response.text.includes('synthetic-secret'), false);
  } finally { await f.close(); }
});
