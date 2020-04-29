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

    resumed = false;

    constructor() {
        this.ctx = new AudioContext();

        function mul<T>(arr: Array<T>): Array<T> {
            for (let i = 0; i < 12; i++) {
                arr = arr.flatMap(v => [v, v]);
            }
            return arr;
        }

        for (let i = 0; i < 4; i++) {
            let t = FFT(mul(preFFT[i]));
            this.periodicWaves[i] = this.ctx.createPeriodicWave(t.real, t.imag, { disableNormalization: false });
        }

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

        let highPass = this.ctx.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 120;

        this.masterGain.connect(highPass).connect(this.ctx.destination);


        window.addEventListener('click', () => {
            if (!this.resumed) {
                this.resumed = true;

                this.setMuted(false);
            }
        });
    }

    pulse1(s: SoundChip) {
        // Pulse 1
        if (s.enabled && this.ch1 && s.pulse1.enabled && s.pulse1.dacEnabled && (s.pulse1.outputLeft || s.pulse1.outputRight)) {
            if (s.pulse1.updated) {
                this.pulse1Pan.pan.value = s.pulse1.pan;
                this.pulse1Gain.gain.value = s.pulse1.volume / 15 / 2.5;
                let freq = s.pulse1.frequencyHz;
                if (freq > 24000) freq = 24000;
                this.pulse1Osc.frequency.value = freq;
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
                this.pulse2Pan.pan.value = s.pulse2.pan;
                this.pulse2Gain.gain.value = s.pulse2.volume / 15 / 2.5;
                let freq = s.pulse2.frequencyHz;
                if (freq > 24000) freq = 24000;
                this.pulse2Osc.frequency.value = freq;
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

                let freq = s.wave.frequencyHz;
                if (freq > 24000) freq = 24000;
                this.waveOsc.frequency.value = freq;

                this.waveGain.gain.value = [0, 1, 0.50, 0.25][s.wave.volume] / 2.25;
            }
        } else {
            this.waveGain.gain.value = 0;
        }
    }

    updateWaveTable(s: SoundChip) {
        this.waveOsc.setPeriodicWave(this.generateWaveBuffer(s));
    }

    waveTableCache: PeriodicWave[] = [];

    generateWaveBuffer(s: SoundChip): PeriodicWave {
        let hash = 0;
        for (let i = 0; i < 32; i++) {
            // Port of Java string hashCode
            var char = s.wave.waveTable[i];
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        const check = this.waveTableCache[hash];
        if (check == undefined) {
            const waveTable = s.wave.waveTable.map(v => (v - 8) / 8).flatMap(i => [
                i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i,
                i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i,
            ]);

            const transformed = FFT(waveTable);

            return this.waveTableCache[hash] = this.ctx.createPeriodicWave(transformed.real, transformed.imag);
        } else {
            return check;
        }
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
                    this.noise7Gain.gain.value = 0;
                    this.noise15Gain.gain.value = s.noise.volume / 15 / 4;

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
        if (muted === true) {
            if (this.ctx.state === 'running') {
                this.ctx.suspend();
            }
        } else {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
    }
}

const MAX_VOLUME = 0.5;