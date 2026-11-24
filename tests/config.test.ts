import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createHash } from 'node:crypto';
import { parseCredentials } from '../src/server/config.ts';
import { unlockKey } from '../src/server/auth.ts';

// Entirely synthetic identifiers, never used to contact OCI.
const config = `[SPEECH_POC]\nuser=ocid1.user.oc1..synthetic\ntenancy=ocid1.tenancy.oc1..synthetic\nfingerprint=${Array(16).fill('aa').join(':')}\nregion=sa-bogota-1\nkey_file=${process.platform === 'win32' ? 'C:/synthetic/private.pem' : '/synthetic/private.pem'}\n`;
const parse = (s: string) => parseCredentials(s, 'ocid1.compartment.oc1..synthetic', 'sa-bogota-1');

test('dedicated complete API-key profile is accepted without reading any file', () => {
  assert.equal(parse(config).region, 'sa-bogota-1');
});
test('rejects DEFAULT inheritance, session auth, persisted passphrases and duplicate keys', () => {
  for (const text of [config.replace('SPEECH_POC', 'DEFAULT'),
    `[DEFAULT]\nregion=sa-bogota-1\n${config}`,
    `${config}security_token_file=/synthetic/session\n`,
    `${config}pass_phrase=synthetic-secret\n`,
    `${config}user=ocid1.user.oc1..another\n`,
    config.replace(/^tenancy=.*\n/m, ''), config.replace('sa-bogota-1', 'us-ashburn-1')]) {
    assert.throws(() => parse(text));
  }
});
test('missing placeholders and relative private-key path fail without leaking their values', () => {
  assert.throws(() => parse(config.replace('ocid1.user.oc1..synthetic', 'REEMPLAZAR_USUARIO')), /placeholders/);
  const text = config.replace(/^key_file=.*$/m, 'key_file=private.pem');
  assert.throws(() => parse(text), /absoluta/);
});

test('encrypted synthetic key is unlocked in memory and checked against its public fingerprint', () => {
  // Ephemeral in-memory test key only; no credential files, signing or network calls.
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const fingerprint = createHash('md5').update(pair.publicKey.export({ type: 'spki', format: 'der' }))
    .digest('hex').match(/../g)!.join(':');
  const pem = pair.privateKey.export({ format: 'pem', type: 'pkcs8', cipher: 'aes-256-cbc', passphrase: 'synthetic-test-only' }).toString();
  assert.match(unlockKey(pem, fingerprint, 'synthetic-test-only'), /BEGIN PRIVATE KEY/);
  assert.throws(() => unlockKey(pem, fingerprint, 'incorrect'), /abrir la clave/);
  assert.throws(() => unlockKey(pem, Array(16).fill('00').join(':'), 'synthetic-test-only'), /fingerprint/);
});
