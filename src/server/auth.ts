import { createPrivateKey, createPublicKey, createHash } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { SimpleAuthenticationDetailsProvider, Region, NoRetryConfigurationDetails } from 'oci-common';
import { AIServiceSpeechClient } from 'oci-aispeech';
import { ConfigError, readPrivateFile, type Credentials } from './config.ts';
import type { SessionToken } from '../shared/settings.ts';

export function hiddenPassphrase(): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) throw new ConfigError('La clave está cifrada: inicia la app en una terminal interactiva.');
  stdout.write('Passphrase de la API key (oculta, solo en memoria): ');
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true); stdin.resume();
  return new Promise((resolve, reject) => {
    let input = '';
    const cleanup = () => {
      stdin.off('data', onData); stdin.setRawMode(wasRaw); stdin.pause(); stdout.write('\n');
    };
    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString('utf8')) {
        if (ch === '\u0003') { cleanup(); reject(new ConfigError('Inicio cancelado.')); return; }
        if (ch === '\r' || ch === '\n') { cleanup(); resolve(input); return; }
        if (ch === '\u007f' || ch === '\b') input = input.slice(0, -1);
        else if (ch >= ' ' && input.length < 1024) input += ch;
      }
    };
    stdin.on('data', onData);
  });
}

export function unlockKey(pem: string, fingerprint: string, passphrase?: string): string {
  let key;
  try { key = createPrivateKey({ key: pem, format: 'pem', passphrase }); }
  catch { throw new ConfigError('No se pudo abrir la clave: revisa formato o passphrase.'); }
  if (key.asymmetricKeyType !== 'rsa' || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) {
    throw new ConfigError('Se requiere una API signing key RSA de al menos 2048 bits.');
  }
  const der = createPublicKey(key).export({ type: 'spki', format: 'der' });
  // MD5 is the OCI public-key identifier, not encryption or a password hash.
  const actual = createHash('md5').update(der).digest('hex').match(/../g)!.join(':');
  if (actual !== fingerprint.toLowerCase()) throw new ConfigError('La privada no corresponde al fingerprint del config.');
  return key.export({ type: 'pkcs8', format: 'pem' }).toString();
}

export async function createIssuer(credentials: Credentials): Promise<() => Promise<SessionToken>> {
  const pem = await readPrivateFile(credentials.keyFile);
  const encrypted = /ENCRYPTED/.test(pem);
  const passphrase = encrypted ? await hiddenPassphrase() : undefined;
  const privateKey = unlockKey(pem, credentials.fingerprint, passphrase);
  const provider = new SimpleAuthenticationDetailsProvider(credentials.tenancy, credentials.user,
    credentials.fingerprint, privateKey, null, Region.fromRegionId(credentials.region));
  const client = new AIServiceSpeechClient({ authenticationDetailsProvider: provider });
  client.endpoint = 'https://speech.aiservice.sa-bogota-1.oci.oraclecloud.com';
  return async () => {
    const response = await client.createRealtimeSessionToken({
      createRealtimeSessionTokenDetails: { compartmentId: credentials.compartmentId },
      retryConfiguration: NoRetryConfigurationDetails,
    });
    const value = response.realtimeSessionToken;
    if (!value?.token || !value.sessionId || value.compartmentId !== credentials.compartmentId) {
      throw new Error('Invalid token response');
    }
    return { token: value.token, sessionId: value.sessionId, compartmentId: value.compartmentId };
  };
}
