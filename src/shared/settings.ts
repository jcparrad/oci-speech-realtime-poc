export const settings = Object.freeze({
  region: 'sa-bogota-1', modelType: 'ORACLE', modelDomain: 'GENERIC',
  languageCode: 'es-ES', punctuation: 'AUTO', encoding: 'audio/raw;rate=16000',
  partialSilenceThresholdInMs: 0, finalSilenceThresholdInMs: 1000,
  stabilizePartialResults: 'MEDIUM',
});
export const speechEndpoint = 'wss://realtime.aiservice.sa-bogota-1.oci.oraclecloud.com/ws/transcribe/stream';
export interface SessionToken { token: string; sessionId: string; compartmentId: string }
