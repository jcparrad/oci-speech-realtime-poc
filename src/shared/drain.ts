import type { Transcript } from './transcript.ts';

/** No service-specific EOS acknowledgement exists in the inspected contract.
 * Report evidence conservatively instead of treating a timeout as successful finalization. */
export function finalizationConfirmed(transcript: Transcript, finalCountBeforeRequest: number): boolean {
  return transcript.finalCount > finalCountBeforeRequest && !transcript.hasPending;
}
