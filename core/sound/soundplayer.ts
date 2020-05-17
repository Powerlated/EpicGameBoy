export class SoundPlayer {
    ctx = new AudioContext({ sampleRate: 65536 });
    sources: AudioBufferSourceNode[] = []

    queueAudio(inSamples: number, bufferLeft: Float32Array, bufferRight: Float32Array, time: number) {
        let buffer = this.ctx.createBuffer(2, inSamples, 65536);
        let channel0 = buffer.getChannelData(0);
        let channel1 = buffer.getChannelData(1);
        for (let i = 0; i < inSamples; i++) {
            channel0[i] = bufferLeft[i];
            channel1[i] = bufferRight[i];
        }
        let bufferSource = this.ctx.createBufferSource();
        this.sources.push(bufferSource)
        bufferSource.buffer = buffer;
        bufferSource.connect(this.ctx.destination);
        bufferSource.start(time);
    }

    reset() {
        // Stop all sounds
        this.sources.forEach((v, i, a) => {
            v.stop();
        })
        
    }
}