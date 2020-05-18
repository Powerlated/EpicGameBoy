
export const SAMPLE_RATE = 65536;
export class SoundPlayer {
    constructor() {
        const AudioContext = window.AudioContext   // Normal browsers
            || (window as any).webkitAudioContext; // Sigh... Safari

        this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });

        const fixAudioContext = () => {
            // Create empty buffer
            let buffer = this.ctx.createBuffer(1, 1, 22050);
            let source = this.ctx.createBufferSource();
            source.buffer = buffer;
            // Connect to output (speakers)
            source.connect(this.ctx.destination);
            // Play sound
            if (source.start) {
                source.start(0);
            } else if ((source as any).play) {
                (source as any).play(0);
            } else if ((source as any).noteOn) {
                (source as any).noteOn(0);
            }

            // Remove events
            document.removeEventListener('touchstart', fixAudioContext);
            document.removeEventListener('touchend', fixAudioContext);
        };
        // iOS 6-8
        document.addEventListener('touchstart', fixAudioContext);
        // iOS 9
        document.addEventListener('touchend', fixAudioContext);
    }

    ctx: AudioContext;
    sources: AudioBufferSourceNode[] = [];

    queueAudio(inSamples: number, bufferLeft: Float32Array, bufferRight: Float32Array, time: number) {
        let buffer = this.ctx.createBuffer(2, inSamples, SAMPLE_RATE);
        let channel0 = buffer.getChannelData(0);
        let channel1 = buffer.getChannelData(1);
        for (let i = 0; i < inSamples; i++) {
            channel0[i] = bufferLeft[i];
            channel1[i] = bufferRight[i];
        }
        let bufferSource = this.ctx.createBufferSource();
        this.sources.push(bufferSource);
        bufferSource.buffer = buffer;
        bufferSource.connect(this.ctx.destination);
        bufferSource.start(time);
    }

    reset() {
        // Stop all sounds
        this.sources.forEach((v, i, a) => {
            v.stop();
        });
        this.sources = [];
    }
}