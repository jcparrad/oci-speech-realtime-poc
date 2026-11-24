import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCredentials, ConfigError } from './config.ts';
import { makeServer } from './http.ts';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const demo = args.includes('--demo');
const portArg = args.find(x => x.startsWith('--port='));
const port = portArg ? Number(portArg.slice(7)) : 8000;
try {
  if (args.some(x => x !== '--demo' && !x.startsWith('--port=')) || !Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new ConfigError('Opciones: --demo y --port=8000 (1024–65535).');
  }
  // Demo deliberately skips .env, all private files and all OCI client initialization.
  const issue = demo ? undefined : await (await import('./auth.ts')).createIssuer(await loadCredentials(appRoot));
  const server = makeServer({ port, publicDir: resolve(appRoot, 'dist/public'), demo, issue });
  server.on('error', () => { console.error('No se pudo abrir el puerto local. Revisa si está ocupado.'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`PoC Speech: http://127.0.0.1:${port}`);
    console.log(demo ? 'DEMOSTRACIÓN: datos ficticios, sin micrófono, credenciales ni OCI.' : 'Lista para tu prueba manual. OCI se contactará al iniciar dictado.');
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { server.close(); server.closeAllConnections(); });
  }
} catch (error) {
  console.error(error instanceof ConfigError ? error.message : 'No se pudo iniciar. Revisa la guía de credenciales; no compartas secretos.');
  process.exitCode = 1;
}
