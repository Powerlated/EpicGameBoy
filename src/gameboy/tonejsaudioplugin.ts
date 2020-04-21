import * as Tone from "tone";
import { AudioPlugin } from "../../core/sound/audioplugin";
import SoundChip from "../../core/sound/sound";

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

export default class ToneJsAudioPlugin implements AudioPlugin {
    pulseOsc1: Tone.Oscillator;
    pulseVolumeShaper1: Tone.WaveShaper;
    pulsePan1: Tone.Panner;

    pulseOsc2: Tone.Oscillator;
    pulseVolumeShaper2: Tone.WaveShaper;
    pulsePan2: Tone.Panner;

    waveSrc: Tone.BufferSource;
    wavePan: Tone.Panner;
    waveVolumeShaper: Tone.WaveShaper;
    waveVolume: Tone.Volume;

    noise7Src: Tone.BufferSource;
    noise7Volume: Tone.Volume;

    noise15Src: Tone.BufferSource;
    noise15Volume: Tone.Volume;

    noiseVolumeShaper: Tone.WaveShaper;

    noisePan: Tone.Panner;

    ch1 = true;
    ch2 = true;
    ch3 = true;
    ch4 = true;

    masterVolume: Tone.Volume;

    constructor() {
        this.pulseOsc1 = new Tone.Oscillator(0, "triangle");
        this.pulseOsc1.volume.value = 0;
        this.pulseOsc1.mute = true;
        this.pulseVolumeShaper1 = new Tone.WaveShaper((i: number) => 0);
        this.pulsePan1 = new Tone.Panner(0);
        this.pulseOsc1.chain(this.pulseVolumeShaper1, this.pulsePan1, Tone.Master);
        this.pulseOsc1.start();

        this.pulseOsc2 = new Tone.Oscillator(0, "triangle");
        this.pulseOsc2.volume.value = 0;
        this.pulseOsc2.mute = true;
        this.pulseVolumeShaper2 = new Tone.WaveShaper((i: number) => 0);
        this.pulsePan2 = new Tone.Panner(0);
        this.pulseOsc2.chain(this.pulseVolumeShaper2, this.pulsePan2, Tone.Master);
        this.pulseOsc2.start();


        // Create a dummy AudioBuffer, this is updated by updateWaveTable();
        const dummyBuffer = (Tone.context as any as AudioContext).createBuffer(1, 1, 48000);

        this.waveSrc = new Tone.BufferSource(dummyBuffer, () => { });
        this.waveSrc.loop = true;
        this.wavePan = new Tone.Panner(0);
        this.waveVolume = new Tone.Volume(0);
        this.waveVolume.mute = true;
        this.waveVolumeShaper = new Tone.WaveShaper((i: number) => 0);
        this.waveSrc.chain(this.waveVolume, this.waveVolumeShaper, this.wavePan, Tone.Master);
        this.waveSrc.start();

        this.noiseVolumeShaper = new Tone.WaveShaper((i: number) => 0);
        this.noisePan = new Tone.Panner(0);

        this.noise7Src = new Tone.BufferSource(this.generateNoiseBuffer(true), () => { });
        this.noise7Src.loop = true;
        this.noise7Volume = new Tone.Volume(0);
        this.noise7Volume.mute = true;
        this.noise7Src.chain(this.noise7Volume, this.noiseVolumeShaper, this.noisePan, Tone.Master);
        this.noise7Src.start();

        this.noise15Src = new Tone.BufferSource(this.generateNoiseBuffer(false), () => { });
        this.noise15Src.loop = true;
        this.noise15Volume = new Tone.Volume(0);
        this.noise15Volume.mute = true;
        this.noise15Src.chain(this.noise15Volume, this.noiseVolumeShaper, this.noisePan, Tone.Master);
        this.noise15Src.start();

        this.masterVolume = new Tone.Volume(-12);
        Tone.Master.chain(new Tone.Filter(22050, 'lowpass', -96), this.masterVolume);

        Tone.context.lookAhead = 0;
    }

    pulse1(s: SoundChip) {
        // Pulse 1
        if (s.enabled && this.ch1 && s.pulse1.enabled && s.pulse1.dacEnabled && (s.pulse1.outputLeft || s.pulse1.outputRight)) {
            if (s.pulse1.updated) {
                this.pulsePan1.pan.value = s.pulse1.pan;
                this.pulseOsc1.mute = false;
                this.pulseVolumeShaper1.setMap((i: number) => {
                    const mul = 0.6;

                    const vol = s.pulse1.volume / 15;
                    if (i > thresholds[s.pulse1.width]) {
                        return 1 * vol * mul;
                    } else {
                        return -1 * vol * mul;
                    }
                });
                this.pulseOsc1.frequency.value = s.pulse1.frequencyHz;
                // this.pulseOsc1.width.value = widths[s.pulse1.width];
            }
        } else {
            this.pulseOsc1.mute = true;
        }
    }

    pulse2(s: SoundChip) {
        // Pulse 2
        if (s.enabled && this.ch2 && s.pulse2.enabled && s.pulse2.dacEnabled && (s.pulse2.outputLeft || s.pulse2.outputRight)) {
            if (s.pulse2.updated) {
                this.pulsePan2.pan.value = s.pulse2.pan;
                this.pulseOsc2.mute = false;
                this.pulseVolumeShaper2.setMap((i: number) => {
                    const mul = 0.6;

                    const vol = s.pulse2.volume / 15;
                    if (i > thresholds[s.pulse2.width]) {
                        return 1 * vol * mul;
                    } else {
                        return -1 * vol * mul;
                    }
                });
                this.pulseOsc2.frequency.value = s.pulse2.frequencyHz;
                // this.pulseOsc2.width.value = widths[s.pulse2.width];
            }
        } else {
            this.pulseOsc2.mute = true;
        }
    }

    wave(s: SoundChip) {
        if (s.enabled && this.ch3 && s.wave.enabled && s.wave.dacEnabled && (s.wave.outputLeft || s.wave.outputRight)) {
            if (s.wave.updated) {
                this.waveVolume.mute = false;

                this.wavePan.pan.value = s.wave.pan;
                this.waveSrc.playbackRate.value = s.wave.frequencyHz / 220;

                let vol = 0;
                switch (s.wave.volume) {
                    case 0: vol = 0; break;
                    case 1: vol = 1; break;
                    case 2: vol = 0.50; break;
                    case 3: vol = 0.25; break;
                }


                this.waveVolumeShaper.setMap((i: number) => {
                    return i * vol;
                });
            }
        } else {
            this.waveVolume.mute = true;
        }

    }

    updateWaveTable(s: SoundChip) {
        // return;
        this.waveSrc.stop();
        this.wavePan.disconnect(Tone.Master);
        this.waveVolume.disconnect(this.waveVolumeShaper);
        this.waveSrc.buffer.dispose();
        this.waveSrc.dispose();

        this.waveSrc = new Tone.BufferSource(this.generateWaveBuffer(s), () => { });
        this.waveSrc.playbackRate.value = s.wave.frequencyHz / 220;
        this.waveSrc.loop = true;
        this.waveSrc.chain(this.waveVolume, this.waveVolumeShaper, this.wavePan, Tone.Master).start();
    }

    generateWaveBuffer(s: SoundChip): AudioBuffer {
        const sampleRate = 112640; // A440 without any division
        const waveTable = s.wave.waveTable.map(v => (v - 8) / 8).flatMap(i => [i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i]);

        const ac = (Tone.context as any as AudioContext);
        const arrayBuffer = ac.createBuffer(1, waveTable.length, sampleRate);
        const buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    noise(s: SoundChip) {
        // Noise
        if (s.noise.enabled && this.ch4 && s.noise.dacEnabled && (s.noise.outputLeft || s.noise.outputRight)) {
            if (s.noise.updated) {
                this.noiseVolumeShaper.setMap((i: number) => {
                    const mul = 1;

                    return i * (s.noise.volume / 15) * mul;
                });

                this.noisePan.pan.value = s.noise.pan;

                const div = [8, 16, 32, 48, 64, 80, 96, 112][s.noise.divisorCode];
                const rate = 4194304 / (div << s.noise.shiftClockFrequency);

                if (s.noise.counterStep) {
                    // 7 bit noise
                    this.noise15Volume.mute = true;
                    this.noise7Volume.mute = false;

                    if (isFinite(rate))
                        this.noise7Src.playbackRate.value = rate / (48000 / 16);
                } else {
                    // 15 bit noise
                    this.noise15Volume.mute = false;
                    this.noise7Volume.mute = true;

                    if (isFinite(rate))
                        this.noise15Src.playbackRate.value = rate / (48000 / 16);
                }
            }
        } else {
            this.noise15Volume.mute = true;
            this.noise7Volume.mute = true;
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
                    seed &= ~(1 << 6);
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

        const ac = Tone.context as any as AudioContext;
        const arrayBuffer = ac.createBuffer(1, waveTable.length, 48000);
        const buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    reset() {
        this.pulseOsc1.mute = true;
        this.pulseOsc2.mute = true;
        this.waveVolume.mute = true;
        this.noise15Volume.mute = true;
        this.noise7Volume.mute = true;
    }

    setMuted(muted: boolean) {
        Tone.Master.mute = muted;
    }
}