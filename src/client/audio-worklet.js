/* PCM signed 16-bit little endian, mono. AudioContext must run at 16000 Hz. */
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Int16Array(1600); // 100 ms packets, with a flush for the last fraction.
    this.used = 0;
    this.active = false;
    this.done = false;
    this.port.onmessage = ({ data }) => {
      if (data === 'start') this.active = true;
      if (data === 'stop') {
        this.active = false;
        this.flush();
        this.port.postMessage({ type: 'flushed' });
        this.done = true;
      }
    };
  }
  flush() {
    if (!this.used) return;
    const buffer = new ArrayBuffer(this.used * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < this.used; i++) view.setInt16(i * 2, this.samples[i], true);
    this.port.postMessage({ type: 'audio', buffer }, [buffer]);
    this.used = 0;
  }
  process(inputs) {
    if (this.active) {
      const channel = inputs[0]?.[0];
      if (channel) for (const value of channel) {
        const sample = Math.max(-1, Math.min(1, value));
        this.samples[this.used++] = Math.round(sample * (sample < 0 ? 32768 : 32767));
        if (this.used === this.samples.length) this.flush();
      }
    }
    return !this.done;
  }
}
registerProcessor('poc-pcm-capture', PcmCapture);
