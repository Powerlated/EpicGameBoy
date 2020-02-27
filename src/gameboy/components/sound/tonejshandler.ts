import SoundChip from "./sound";
import * as Tone from "tone";

export default class ToneJsHandler {
    pulseOsc1: Tone.PulseOscillator;
    pulsePan1: Tone.Panner;
    pulseOsc2: Tone.PulseOscillator;
    pulsePan2: Tone.Panner;
    waveSrc: Tone.BufferSource;
    wavePan: Tone.Panner;
    waveVolume: Tone.Volume;

    noiseSrc: Tone.BufferSource;
    noiseVolume: Tone.Volume;

    s: SoundChip;

    constructor(s: SoundChip) {

        this.s = s;
        this.pulseOsc1 = new Tone.PulseOscillator(0, .5);
        this.pulseOsc1.volume.value = -36;
        this.pulsePan1 = new Tone.Panner(0);
        this.pulseOsc1.chain(this.pulsePan1, Tone.Master);
        this.pulseOsc1.start();

        this.pulseOsc2 = new Tone.PulseOscillator(0, 0.5);
        this.pulseOsc2.volume.value = -36;
        this.pulsePan2 = new Tone.Panner(0);
        this.pulseOsc2.chain(this.pulsePan2, Tone.Master);
        this.pulseOsc2.start();

        this.waveSrc = new Tone.BufferSource(this.getWaveBuffer(), () => { });
        this.waveSrc.loop = true;
        this.waveVolume = new Tone.Volume();
        this.waveVolume.volume.value = -36;
        this.wavePan = new Tone.Panner(0);
        this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master);
        this.waveSrc.start();

        this.noiseSrc = new Tone.BufferSource(this.getNoiseBuffer(), () => { });
        this.noiseSrc.loop = true;
        this.noiseVolume = new Tone.Volume();
        this.noiseVolume.mute = true;
        this.noiseSrc.chain(this.noiseVolume, Tone.Master);
        this.noiseSrc.start();
    }

    getNoiseBuffer(): AudioBuffer {
        let waveTable: number[] = new Array(4800).fill(0);
        waveTable = waveTable.map((v, i) => {
            return Math.round(Math.random());
        });

        let ac: AudioContext = (Tone.context as any as AudioContext);
        let arrayBuffer: AudioBuffer = ac.createBuffer(1, waveTable.length, 48000);
        let buffering: Float32Array = arrayBuffer.getChannelData(0);
        for (let i: number = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    getWaveBuffer(): AudioBuffer {
        let sampleRate: number = 56320 * (this.s.wave.frequencyHz / 440); // A440 without any division
        if (sampleRate > 384000) {
            sampleRate = 56320; // Back to A440 if invalid vale in BaseAudioContext.createBuffer()
        }

        let waveTable: number[] = this.s.wave.waveTable.map(v => { return (v - 8) / 8; });
        waveTable = waveTable.reduce(function (m: any, i: any): number[] { return m.concat(new Array(4).fill(i)); }, []);

        // Output all zeroes if frequency binary is zero
        if (this.s.wave.frequencyHz == 32) {
            waveTable = new Array(1).fill(0);
        }

        let ac: AudioContext = (Tone.context as any as AudioContext);
        let arrayBuffer: AudioBuffer = ac.createBuffer(1, waveTable.length, sampleRate);
        let buffering: Float32Array = arrayBuffer.getChannelData(0);
        for (let i: number = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    step(): void {
        // #endregion

        // #region TONE.JS HANDLING

        // frequencyHz check is for removing loud noises when frequency is zeroed

        // Pulse 1
        if (this.s.pulse1.enabled && this.s.pulse1.frequencyLower != 0 && this.s.pulse1.updated) {
            this.pulseOsc1.mute = false;
            this.pulseOsc1.volume.value = SoundChip.convertVolume(this.s.pulse1.volume);
            this.pulseOsc1.frequency.value = this.s.pulse1.frequencyHz;
            this.pulseOsc1.width.value = SoundChip.widths[this.s.pulse1.width];
        } else {
            this.pulseOsc1.mute = true;
        }

        // Pulse 2
        if (this.s.pulse2.enabled && this.s.pulse2.frequencyLower != 0 && this.s.pulse2.updated) {
            this.pulseOsc2.mute = false;
            this.pulseOsc2.volume.value = SoundChip.convertVolume(this.s.pulse2.volume);
            this.pulseOsc2.frequency.value = this.s.pulse2.frequencyHz;
            this.pulseOsc2.width.value = SoundChip.widths[this.s.pulse2.width];
        } else {
            this.pulseOsc2.mute = true;
        }

        // Wave
        if (this.s.wave.enabled && this.s.wave.frequencyLower != 0 && this.s.wave.updated) {
            this.waveVolume.mute = false;
            this.waveVolume.volume.value = SoundChip.convertVolumeWave(this.s.wave.volume);
        } else {
            this.waveVolume.mute = true;
        }

        // Noise
        if (this.s.noise.enabled && this.s.noise.updated) {
            this.noiseVolume.mute = false;
            this.noiseVolume.volume.value = SoundChip.convertVolume(this.s.noise.volume);
        } else {
            this.noiseVolume.mute = true;
        }

        if (this.s.wave.waveTableUpdated == true) {
            this.waveSrc.dispose();

            this.waveSrc = new Tone.BufferSource(this.getWaveBuffer(), () => { });
            this.waveSrc.loop = true;
            this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master).start();

            this.s.wave.waveTableUpdated = false;
        }

        this.pulsePan1.pan.value = this.s.pulse1.pan;
        this.pulsePan2.pan.value = this.s.pulse2.pan;
        this.wavePan.pan.value = this.s.wave.pan;

    }
}