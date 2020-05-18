let safariHax = false;
if (!AudioBuffer.prototype.copyToChannel) safariHax = true;

export const NORMAL_SAMPLE_RATE = 262144;
export const SAMPLE_RATE = safariHax ? 65536 : 262144;
export const LATENCY = safariHax ? 2048 : 8192;
export const LATENCY_SEC = LATENCY / SAMPLE_RATE;

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
        };
        // iOS 6-8
        document.addEventListener('touchstart', fixAudioContext);
        // iOS 9
        document.addEventListener('touchend', fixAudioContext);
    }

    ctx: AudioContext;
    sources: AudioBufferSourceNode[] = [];

    sampleRate = SAMPLE_RATE;

    queueAudio(bufferLeft: Float32Array, bufferRight: Float32Array, sampleRate: number) {
        const length = Math.max(bufferLeft.length, bufferRight.length);
        let buffer = this.ctx.createBuffer(2, length, sampleRate);

        if (!safariHax) {
            buffer.copyToChannel(bufferLeft, 0);
            buffer.copyToChannel(bufferRight, 1);
        } else {
            buffer.getChannelData(0).set(bufferLeft);
            buffer.getChannelData(1).set(bufferRight);
        }

        let bufferSource = this.ctx.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.connect(this.ctx.destination);
        bufferSource.start(this.audioSec);

        this.sampleRate = sampleRate;
        this.audioSec += LATENCY / sampleRate;

        this.sources.push(bufferSource);
    }

    audioSec = 0;

    reset() {
        // Stop all sounds
        this.sources.forEach((v, i, a) => {
            v.stop();
        });
        this.sources = [];

        this.audioSec = this.ctx.currentTime + (LATENCY / this.sampleRate);
        // console.log(`Latency in seconds: ${(LATENCY / this.sampleRate)}`)
    }
}