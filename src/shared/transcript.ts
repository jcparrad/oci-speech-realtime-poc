export interface Segment {
  transcription: string;
  isFinal: boolean;
  startTimeInMs: number;
  endTimeInMs: number;
}

/** Session-relative offsets are only unique within one dictation. */
export class Transcript {
  private finals = new Map<number, Segment>();
  private partials = new Map<number, Segment>();
  finalCount = 0;

  accept(segments: Segment[]): void {
    for (const s of segments) {
      if (!Number.isFinite(s.startTimeInMs) || !Number.isFinite(s.endTimeInMs) ||
          s.startTimeInMs < 0 || s.endTimeInMs < s.startTimeInMs ||
          typeof s.transcription !== 'string' || typeof s.isFinal !== 'boolean') continue;
      if (s.isFinal) {
        if (!this.finals.has(s.startTimeInMs)) this.finalCount++;
        this.finals.set(s.startTimeInMs, { ...s });
        this.partials.delete(s.startTimeInMs);
      } else if (!this.finals.has(s.startTimeInMs)) {
        this.partials.set(s.startTimeInMs, { ...s });
      }
    }
  }
  get finalText(): string { return this.join(this.finals); }
  get partialText(): string { return this.join(this.partials); }
  get hasPending(): boolean { return this.partials.size > 0; }
  private join(items: Map<number, Segment>): string {
    return [...items.values()].sort((a, b) => a.startTimeInMs - b.startTimeInMs)
      .map(s => s.transcription.trim()).filter(Boolean).join(' ');
  }
}

/** Strict allowlist: authentication messages and arbitrary server fields never reach the viewer. */
export function safeResult(message: unknown): { event: 'RESULT'; transcriptions: Segment[] } | null {
  if (!message || typeof message !== 'object') return null;
  const m = message as Record<string, unknown>;
  if (m.event !== 'RESULT' || !Array.isArray(m.transcriptions)) return null;
  const segments: Segment[] = [];
  for (const item of m.transcriptions.slice(0, 20)) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Record<string, unknown>;
    if (typeof s.transcription === 'string' && typeof s.isFinal === 'boolean' &&
        typeof s.startTimeInMs === 'number' && typeof s.endTimeInMs === 'number') {
      segments.push({ transcription: s.transcription.slice(0, 20000), isFinal: s.isFinal,
        startTimeInMs: s.startTimeInMs, endTimeInMs: s.endTimeInMs });
    }
  }
  return { event: 'RESULT', transcriptions: segments };
}
