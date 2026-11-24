import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { settings, type SessionToken } from '../shared/settings.ts';

interface Options {
  port: number; publicDir: string; demo: boolean; issue?: () => Promise<SessionToken>;
  now?: () => number;
}
export function makeServer(options: Options) {
  let busy = false, lastIssue = -Infinity;
  const now = options.now ?? Date.now;
  const assets: Record<string, [string, string]> = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/audio-worklet.js': ['audio-worklet.js', 'text/javascript; charset=utf-8'],
    '/style.css': ['style.css', 'text/css; charset=utf-8'],
  };
  const json = (res: ServerResponse, status: number, data: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data));
  };
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'microphone=(self)');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'self' wss://realtime.aiservice.sa-bogota-1.oci.oraclecloud.com; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const host = req.headers.host;
    if (host !== `127.0.0.1:${options.port}` && host !== `localhost:${options.port}`) {
      json(res, 403, { error: 'Host local no permitido.' }); return;
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      json(res, 403, { error: 'Origen no permitido.' }); return;
    }
    if (req.method === 'GET' && req.url === '/api/config') {
      json(res, 200, { mode: options.demo ? 'demo' : 'live', settings }); return;
    }
    if (req.url === '/api/speech/session') {
      if (req.method !== 'POST') { json(res, 405, { error: 'Usa POST.' }); return; }
      if (req.headers.origin !== `http://${host}` || req.headers['x-speech-poc'] !== '1' ||
          req.headers['content-type'] !== 'application/json') {
        json(res, 403, { error: 'Solicitud local no permitida.' }); return;
      }
      let body = '', oversized = false;
      for await (const chunk of req) {
        if (Buffer.byteLength(body) + chunk.length > 128) oversized = true;
        if (!oversized) body += chunk.toString();
      }
      if (oversized) { json(res, 413, { error: 'Solicitud demasiado grande.' }); return; }
      if (body.trim() !== '{}') { json(res, 400, { error: 'El cuerpo debe ser {}.' }); return; }
      if (options.demo) { json(res, 409, { error: 'La demostración no emite tokens ni conecta a OCI.' }); return; }
      if (busy || now() - lastIssue < 5000) { json(res, 429, { error: 'Espera cinco segundos antes de otra sesión.' }); return; }
      busy = true; lastIssue = now();
      try {
        if (!options.issue) throw new Error('No issuer');
        json(res, 200, await options.issue());
      } catch (error) {
        // Never serialize SDK errors, response objects, authorization headers or tokens.
        const code = error && typeof error === 'object' && 'statusCode' in error ? Number(error.statusCode) : 0;
        json(res, 502, { error: code === 401 || code === 403
          ? `OCI rechazó la autorización (${code}). Revisa identidad y permisos del compartimento.`
          : 'No se pudo obtener el token de OCI. Revisa acceso, región y conectividad.' });
      } finally { busy = false; }
      return;
    }
    const asset = req.url ? assets[req.url] : undefined;
    if (req.method !== 'GET' || !asset) { json(res, 404, { error: 'Ruta no disponible.' }); return; }
    try {
      const data = await readFile(join(options.publicDir, asset[0]));
      res.writeHead(200, { 'Content-Type': asset[1] }); res.end(data);
    } catch { json(res, 503, { error: 'Falta compilar la interfaz: ejecuta npm run build.' }); }
  };
  const server = createServer((req, res) => {
    handle(req, res).catch(() => { if (!res.headersSent) json(res, 400, { error: 'Solicitud inválida.' }); else res.end(); });
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  return server;
}
