import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { parseEnv } from 'node:util';

export class ConfigError extends Error {}
export interface Credentials {
  user: string; tenancy: string; fingerprint: string; keyFile: string;
  compartmentId: string; region: string;
}
const invalid = (text: string): never => { throw new ConfigError(text); };
const ocid = (kind: string, value: string) => new RegExp(`^ocid1\\.${kind}\\.oc[0-9]+\\.[a-z0-9.-]+$`, 'i').test(value);

export function parseCredentials(text: string, compartmentId: string, region: string, profileName: string): Credentials {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(profileName) || profileName.toUpperCase() === 'DEFAULT') {
    invalid('OCI_CONFIG_PROFILE debe indicar un perfil explícito de 1–64 letras, números, guiones o guiones bajos; no DEFAULT.');
  }
  const allowed = new Set(['user', 'tenancy', 'fingerprint', 'region', 'key_file']);
  const values = new Map<string, string>();
  let profile = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[')) {
      if (profile || line !== `[${profileName}]`) invalid('El config debe contener un único perfil, coincidente con OCI_CONFIG_PROFILE.');
      profile = true; continue;
    }
    const index = line.indexOf('=');
    if (!profile || index < 1) invalid('Formato de config inválido. Revisa la plantilla.');
    const key = line.slice(0, index).trim(), value = line.slice(index + 1).trim();
    if (!allowed.has(key) || values.has(key)) invalid('El config contiene campos no admitidos o repetidos.');
    if (!value || value.includes('REEMPLAZAR') || /[<>\r\n]/.test(value)) invalid('Completa los placeholders del config.');
    values.set(key, value);
  }
  if (values.size !== allowed.size) invalid('Faltan campos obligatorios en el perfil seleccionado.');
  const get = (key: string) => values.get(key)!;
  if (region !== 'sa-bogota-1' || get('region') !== region) invalid('Config y .env deben usar sa-bogota-1.');
  if (!ocid('user', get('user')) || !ocid('tenancy', get('tenancy')) || !ocid('compartment', compartmentId)) {
    invalid('Revisa los OCIDs de usuario, tenant y compartimento.');
  }
  if (!/^([a-f\d]{2}:){15}[a-f\d]{2}$/i.test(get('fingerprint'))) invalid('Formato de fingerprint inválido.');
  if (!isAbsolute(get('key_file'))) invalid('key_file debe ser una ruta absoluta del equipo.');
  return { user: get('user'), tenancy: get('tenancy'), fingerprint: get('fingerprint'),
    region, compartmentId, keyFile: get('key_file') };
}

export async function readPrivateFile(path: string): Promise<string> {
  const info = await stat(path).catch(() => invalid('No se encontró un archivo de configuración o clave. Revisa las rutas.'));
  if (!info.isFile() || info.size > 65536) invalid('Archivo privado inválido o demasiado grande.');
  if (process.platform !== 'win32' && (info.mode & 0o077)) invalid('Config y clave requieren permisos 600 en macOS/Linux.');
  return readFile(path, 'utf8').catch(() => invalid('No se pudo leer un archivo privado. Revisa sus permisos.'));
}

export async function loadCredentials(appRoot: string): Promise<Credentials> {
  const text = await readPrivateFile(resolve(appRoot, '.env'));
  const env = parseEnv(text);
  const expected = ['OCI_CONFIG_FILE', 'OCI_CONFIG_PROFILE', 'OCI_COMPARTMENT_ID', 'OCI_REGION'];
  if (Object.keys(env).some(k => !expected.includes(k)) || expected.some(k => !env[k])) {
    invalid('.env debe contener únicamente los cuatro campos de .env.example, completos.');
  }
  const file = resolve(appRoot, env.OCI_CONFIG_FILE!);
  return parseCredentials(await readPrivateFile(file), env.OCI_COMPARTMENT_ID!, env.OCI_REGION!, env.OCI_CONFIG_PROFILE!);
}
