export class Microphone {
  private stream?: MediaStream;
  private context?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private node?: AudioWorkletNode;
  private muted?: GainNode;
  private flushDone?: () => void;
  private closed = false;
  private pendingStop?: Promise<boolean>;
  private send: (buffer: ArrayBuffer) => void;
  constructor(send: (buffer: ArrayBuffer) => void) { this.send = send; }

  async prepare(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
      throw new Error('Usa un navegador actual en localhost con soporte de micrófono y AudioWorklet.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: {
      channelCount: 1, echoCancellation: true, noiseSuppression: true,
    } });
    if (this.closed) { stream.getTracks().forEach(t => t.stop()); return; }
    this.stream = stream;
    try {
      const context = new AudioContext({ sampleRate: 16000 });
      this.context = context;
      if (context.sampleRate !== 16000) throw new Error('El navegador no admite captura a 16 kHz. Prueba Chrome o Edge actualizados.');
      await context.resume();
      await context.audioWorklet.addModule('/audio-worklet.js');
      if (this.closed) return;
      this.source = context.createMediaStreamSource(stream);
      this.node = new AudioWorkletNode(context, 'poc-pcm-capture', {
        channelCount: 1, channelCountMode: 'explicit', numberOfInputs: 1, numberOfOutputs: 1,
      });
      this.node.port.onmessage = ({ data }) => {
        if (data.type === 'audio' && data.buffer instanceof ArrayBuffer) this.send(data.buffer);
        if (data.type === 'flushed') this.flushDone?.();
      };
      this.muted = context.createGain(); this.muted.gain.value = 0;
      this.source.connect(this.node); this.node.connect(this.muted); this.muted.connect(context.destination);
    } catch (error) { this.dispose(); throw error; }
  }
  start(): void {
    if (!this.node || this.closed) throw new Error('El micrófono no está disponible.');
    this.node.port.postMessage('start');
  }
  stop(): Promise<boolean> {
    if (this.pendingStop) return this.pendingStop;
    this.pendingStop = new Promise<boolean>(resolve => {
      if (!this.node || this.closed) { this.dispose(); resolve(true); return; }
      const timer = setTimeout(() => { this.dispose(); resolve(false); }, 1500);
      this.flushDone = () => { clearTimeout(timer); this.dispose(); resolve(true); };
      this.node.port.postMessage('stop');
    });
    return this.pendingStop;
  }
  dispose(): void {
    this.closed = true;
    this.stream?.getTracks().forEach(t => t.stop());
    this.source?.disconnect(); this.node?.disconnect(); this.muted?.disconnect();
    if (this.node) this.node.port.onmessage = null;
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
  }
}
