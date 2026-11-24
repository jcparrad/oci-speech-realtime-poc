import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCredentials, ConfigError } from './config.ts';
import { makeServer } from './http.ts';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const portArg = args.find(x => x.startsWith('--port='));
const port = portArg ? Number(portArg.slice(7)) : 8000;
try {
  if (args.length > 1 || args.some(x => !/^--port=\d+$/.test(x)) || !Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new ConfigError('Opción admitida: --port=8000 (1024–65535).');
  }
  const issue = await (await import('./auth.ts')).createIssuer(await loadCredentials(appRoot));
  const server = makeServer({ port, publicDir: resolve(appRoot, 'dist/public'), issue });
  server.on('error', () => { console.error('No se pudo abrir el puerto local. Revisa si está ocupado.'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`PoC Speech: http://127.0.0.1:${port}`);
    console.log('Configuración local cargada. OCI se contactará al iniciar dictado en el navegador.');
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { server.close(); server.closeAllConnections(); });
  }
} catch (error) {
  console.error(error instanceof ConfigError ? error.message : 'No se pudo iniciar. Revisa la guía de credenciales; no compartas secretos.');
  process.exitCode = 1;
}
