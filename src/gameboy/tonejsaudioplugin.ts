import { AudioPlugin } from "../../core/sound/audioplugin";
import SoundChip from "../../core/sound/sound";
import { BIT_6 } from "../../core/bit_constants";
import { FFT } from "./fft/fft";

const thresholds = [-0.75, -0.5, 0, 0.5]; // CORRECT

function convertVolumePulse(v: number) {
    const base = -24;
    let mute = 0;
    if (v === 0) mute = -10000;
    return base + mute + (10 * Math.log10(v));
}

function convertVolumeNoise(v: number) {
    const base = -12;
    let mute = 0;
    if (v === 0) mute = -10000;
    return base + mute + (6 * Math.log(v / 8));
}


function convertVolumeWave(v: number) {
    switch (v) {
        case 0: v = 0; break;
        case 1: v = 16; break;
        case 2: v = 10; break;
        case 3: v = 6; break;
    }

    const base = -16;
    let mute = 0;
    if (v === 0) mute = -10000;
    return base + mute + (10 * Math.log(v / 16));
}

const preFFT = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
];

export default class ToneJsAudioPlugin implements AudioPlugin {
    ctx: AudioContext;

    periodicWaves: PeriodicWave[] = [];

    pulse1Osc: OscillatorNode;
    pulse1Gain: GainNode;
    pulse1Pan: StereoPannerNode;

    pulse2Osc: OscillatorNode;
    pulse2Gain: GainNode;
    pulse2Pan: StereoPannerNode;

    waveOsc: OscillatorNode;
    waveGain: GainNode;
    wavePan: StereoPannerNode;

    noise7Buf: AudioBufferSourceNode;
    noise7Gain: GainNode;
    noise15Buf: AudioBufferSourceNode;
    noise15Gain: GainNode;
    noisePan: StereoPannerNode;

    ch1 = true;
    ch2 = true;
    ch3 = true;
    ch4 = true;

    masterGain: GainNode;

    constructor() {
        this.ctx = new AudioContext();

        function mul<T>(arr: Array<T>): Array<T> {
            for (let i = 0; i < 8; i++) {
                arr = arr.flatMap(v => [v, v]);
            }
            return arr;
        }


        let real = FFT(mul(preFFT[0])).real;
        let imag = FFT(mul(preFFT[0])).imag;

        this.periodicWaves[0] = this.ctx.createPeriodicWave(real, imag);

        real = FFT(mul(preFFT[1])).real;
        imag = FFT(mul(preFFT[1])).imag;

        this.periodicWaves[1] = this.ctx.createPeriodicWave(real, imag);

        real = FFT(mul(preFFT[2])).real;
        imag = FFT(mul(preFFT[2])).imag;

        this.periodicWaves[2] = this.ctx.createPeriodicWave(real, imag);

        real = FFT(mul(preFFT[3])).real;
        imag = FFT(mul(preFFT[3])).imag;

        this.periodicWaves[3] = this.ctx.createPeriodicWave(real, imag);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = MAX_VOLUME;

        this.pulse1Gain = this.ctx.createGain();
        this.pulse1Gain.gain.value = 0;
        this.pulse1Osc = this.ctx.createOscillator();
        this.pulse1Osc.setPeriodicWave(this.periodicWaves[2]);
        this.pulse1Pan = this.ctx.createStereoPanner();
        this.pulse1Osc.connect(this.pulse1Gain).connect(this.pulse1Pan).connect(this.masterGain);
        this.pulse1Osc.start();

        this.pulse2Gain = this.ctx.createGain();
        this.pulse2Gain.gain.value = 0;
        this.pulse2Osc = this.ctx.createOscillator();
        this.pulse2Osc.setPeriodicWave(this.periodicWaves[2]);
        this.pulse2Pan = this.ctx.createStereoPanner();
        this.pulse2Osc.connect(this.pulse2Gain).connect(this.pulse2Pan).connect(this.masterGain);
        this.pulse2Osc.start();

        this.waveGain = this.ctx.createGain();
        this.waveGain.gain.value = 0;
        this.waveOsc = this.ctx.createOscillator();
        this.waveOsc.setPeriodicWave(this.periodicWaves[2]);
        this.wavePan = this.ctx.createStereoPanner();
        this.waveOsc.connect(this.waveGain).connect(this.wavePan).connect(this.masterGain);
        this.waveOsc.start();

        this.noisePan = this.ctx.createStereoPanner();

        this.noise7Gain = this.ctx.createGain();
        this.noise7Gain.gain.value = 0;
        this.noise7Buf = this.ctx.createBufferSource();
        this.noise7Buf.loop = true;
        this.noise7Buf.buffer = this.generateNoiseBuffer(true);
        this.noise7Buf.connect(this.noise7Gain).connect(this.noisePan).connect(this.masterGain);
        this.noise7Buf.start();

        this.noise15Gain = this.ctx.createGain();
        this.noise15Gain.gain.value = 0;
        this.noise15Buf = this.ctx.createBufferSource();
        this.noise15Buf.loop = true;
        this.noise15Buf.buffer = this.generateNoiseBuffer(false);
        this.noise15Buf.connect(this.noise15Gain).connect(this.noisePan).connect(this.masterGain);
        this.noise15Buf.start();

        this.masterGain.connect(this.ctx.destination);
    }

    pulse1(s: SoundChip) {
        // Pulse 1
        if (s.enabled && this.ch1 && s.pulse1.enabled && s.pulse1.dacEnabled && (s.pulse1.outputLeft || s.pulse1.outputRight)) {
            if (s.pulse1.updated) {
                this.pulse1Pan.pan.value = s.pulse1.pan;
                this.pulse1Gain.gain.value = s.pulse1.volume / 15;
                this.pulse1Osc.frequency.value = s.pulse1.frequencyHz;
            }
            if (s.pulse1.widthUpdated) {
                this.pulse1Osc.setPeriodicWave(this.periodicWaves[s.pulse1.width]);
            }
        } else {
            this.pulse1Gain.gain.value = 0;
        }
    }

    pulse2(s: SoundChip) {
        // Pulse 2
        if (s.enabled && this.ch2 && s.pulse2.enabled && s.pulse2.dacEnabled && (s.pulse2.outputLeft || s.pulse2.outputRight)) {
            if (s.pulse2.updated) {
                this.pulse2Pan.pan.value = s.pulse1.pan;
                this.pulse2Gain.gain.value = s.pulse2.volume / 15;
                this.pulse2Osc.frequency.value = s.pulse2.frequencyHz;
            }
            if (s.pulse2.widthUpdated) {
                this.pulse2Osc.setPeriodicWave(this.periodicWaves[s.pulse2.width]);
            }
        } else {
            this.pulse2Gain.gain.value = 0;
        }
    }

    wave(s: SoundChip) {
        if (s.enabled && this.ch3 && s.wave.enabled && s.wave.dacEnabled && (s.wave.outputLeft || s.wave.outputRight)) {
            if (s.wave.updated) {
                this.wavePan.pan.value = s.wave.pan;
                this.waveOsc.frequency.value = s.wave.frequencyHz;

                let vol = 0;
                switch (s.wave.volume) {
                    case 0: vol = 0; break;
                    case 1: vol = 1; break;
                    case 2: vol = 0.75; break;
                    case 3: vol = 0.50; break;
                }

                this.waveGain.gain.value = vol * 0.8;
            }
        } else {
            this.waveGain.gain.value = 0;
        }
    }

    updateWaveTable(s: SoundChip) {
        this.waveOsc.setPeriodicWave(this.generateWaveBuffer(s));
    }

    generateWaveBuffer(s: SoundChip): PeriodicWave {
        const waveTable = s.wave.waveTable.map(v => (v - 8) / 16).flatMap(i => [i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i]);

        const transformed = FFT(waveTable);

        return this.ctx.createPeriodicWave(transformed.real, transformed.imag);
    }

    noise(s: SoundChip) {
        // Noise
        if (s.noise.enabled && this.ch4 && s.noise.dacEnabled && (s.noise.outputLeft || s.noise.outputRight)) {
            if (s.noise.updated) {
                this.noisePan.pan.value = s.noise.pan;

                const div = [8, 16, 32, 48, 64, 80, 96, 112][s.noise.divisorCode];
                const rate = 4194304 / (div << s.noise.shiftClockFrequency);

                if (s.noise.counterStep) {
                    // 7 bit noise
                    this.noise15Gain.gain.value = 0;
                    this.noise7Gain.gain.value = s.noise.volume / 15 / 4;

                    if (isFinite(rate))
                        this.noise7Buf.playbackRate.value = rate / (48000 / 16);
                } else {
                    // 15 bit noise
                    this.noise15Gain.gain.value = s.noise.volume / 15 / 4;
                    this.noise7Gain.gain.value = 0;

                    if (isFinite(rate))
                        this.noise15Buf.playbackRate.value = rate / (48000 / 16);
                }
            }
        } else {
            this.noise15Gain.gain.value = 0;
            this.noise7Gain.gain.value = 0;
        }
    }


    generateNoiseBuffer(sevenBit: boolean): AudioBuffer {
        const capacitor = 0.0;

        let seed = 0xFF;
        let period = 0;

        function lfsr(p: number) {
            let bit = (seed >> 1) ^ (seed >> 2);
            bit &= 1;
            if (period > p) {
                seed = (seed >> 1) | (bit << 14);

                if (sevenBit == true) {
                    seed &= ~BIT_6;
                    seed |= (bit << 6);
                }

                period = 0;
            }
            period++;

            return seed & 1;
        }

        const LFSR_MUL = 16;

        let waveTable = new Array(32768 * LFSR_MUL).fill(0);

        waveTable = waveTable.map((v, i) => {
            const bit = lfsr(LFSR_MUL);
            let out;
            if (bit == 1) {
                out = 1;
            } else {
                out = -1;
            }
            return out;
        });

        // waveTable = waveTable.map((v, i) => {
        // return Math.round(Math.random());
        // });

        // waveTable = waveTable.reduce(function (m, i) { return (m as any).concat(new Array(4).fill(i)); }, []);

        const arrayBuffer = this.ctx.createBuffer(1, waveTable.length, 48000);
        const buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    reset() {
        // this.pulseOsc1.mute = true;
        // this.pulseOsc2.mute = true;
        // this.waveVolume.mute = true;
        // this.noise15Gain.mute = true;
        // this.noise7Gain.mute = true;
    }

    setMuted(muted: boolean) {
        if (muted) {
            this.masterGain.gain.value = 0;
        } else {
            this.masterGain.gain.value = MAX_VOLUME;
        }
    }
}

const MAX_VOLUME = 0.5;