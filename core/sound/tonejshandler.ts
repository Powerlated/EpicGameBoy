import SoundChip from "./sound";
import * as Tone from "tone";
import { AudioPlugin } from "./audioplugin";

const widths = [0.5, 0.5, 0, 0.5]; // CORRECT
// const widths = [0.75, 0.5, 0, 0.5]

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

export default class ToneJsHandler implements AudioPlugin {
    pulseOsc1: Tone.PulseOscillator;
    pulseVolumeShaper1: Tone.WaveShaper;
    pulsePan1: Tone.Panner;

    pulseOsc2: Tone.PulseOscillator;
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

    noise7Pan: Tone.Panner;
    noise15Pan: Tone.Panner;

    ch1 = true;
    ch2 = true;
    ch3 = true;
    ch4 = true;




    masterVolume: Tone.Volume;

    s: SoundChip;

    pulse1VolumeValue: number = 0;
    pulse2VolumeValue: number = 0;

    constructor(s: SoundChip) {
        const highPass = new Tone.Filter(120, 'highpass', -12);
        this.masterVolume = new Tone.Volume();

        this.s = s;
        this.pulseOsc1 = new Tone.PulseOscillator(0, .5);
        this.pulseOsc1.volume.value = -12;
        this.pulseOsc1.mute = true;
        this.pulseVolumeShaper1 = new Tone.WaveShaper((i: number) => { return i * (this.pulse1VolumeValue / 15); });
        this.pulsePan1 = new Tone.Panner(0);
        this.pulseOsc1.chain(this.pulseVolumeShaper1, this.pulsePan1, Tone.Master);
        this.pulseOsc1.start();

        this.pulseOsc2 = new Tone.PulseOscillator(0, 0.5);
        this.pulseOsc2.volume.value = -12;
        this.pulseOsc2.mute = true;
        this.pulseVolumeShaper2 = new Tone.WaveShaper((i: number) => { return i * (this.pulse2VolumeValue / 15); });
        this.pulsePan2 = new Tone.Panner(0);
        this.pulseOsc2.chain(this.pulseVolumeShaper2, this.pulsePan2, Tone.Master);
        this.pulseOsc2.start();

        this.waveSrc = new Tone.BufferSource(this.s.wave.buffer, () => { });
        this.waveSrc.loop = true;
        this.wavePan = new Tone.Panner(0);
        this.waveVolume = new Tone.Volume(-6);
        this.waveVolume.mute = true;
        this.waveVolumeShaper = new Tone.WaveShaper((i: number) => { return i * 1; });
        this.waveSrc.chain(this.waveVolume, this.waveVolumeShaper, this.wavePan, Tone.Master);
        this.waveSrc.start();


        this.noiseVolumeShaper = new Tone.WaveShaper((i: number) => { return i * (this.s.noise.volume / 15); });

        this.noise7Src = new Tone.BufferSource(this.s.noise.buffer(true), () => { });
        this.noise7Src.loop = true;
        this.noise7Pan = new Tone.Panner(0);
        this.noise7Volume = new Tone.Volume();
        this.noise7Volume.mute = true;
        this.noise7Volume.volume.value = -12;
        this.noise7Src.chain(this.noise7Volume, this.noiseVolumeShaper, this.noise7Pan, Tone.Master);
        this.noise7Src.start();

        this.noise15Src = new Tone.BufferSource(this.s.noise.buffer(false), () => { });
        this.noise15Src.loop = true;
        this.noise15Pan = new Tone.Panner(0);
        this.noise15Volume = new Tone.Volume();
        this.noise15Volume.mute = true;
        this.noise15Volume.volume.value = -10;
        this.noise15Src.chain(this.noise15Volume, this.noiseVolumeShaper, this.noise15Pan, Tone.Master);
        this.noise15Src.start();
    }

    pulse1() {
        // Pulse 1
        if (this.ch1 && this.s.pulse1.enabled && this.s.pulse1.enabled && this.s.pulse1.dacEnabled && this.s.pulse1.frequencyLower !== 0 && (this.s.pulse1.outputLeft || this.s.pulse1.outputRight)) {
            if (this.s.pulse1.updated) {
                this.pulsePan1.pan.value = this.s.pulse1.pan;
                this.pulseOsc1.mute = false;
                this.pulseOsc1.volume.value = -10;
                this.pulse1VolumeValue = this.s.pulse1.volume;
                this.pulseVolumeShaper1.setMap((i: number) => {
                    let mul = 1;
                    if (this.s.pulse1.width === 3) mul = -1;
                    return i * (this.pulse1VolumeValue / 15);
                });
                this.pulseOsc1.frequency.value = this.s.pulse1.frequencyHz;
                this.pulseOsc1.width.value = widths[this.s.pulse1.width];
            }
        } else {
            this.pulseOsc1.mute = true;
        }
    }

    pulse2() {
        // Pulse 2
        if (this.ch2 && this.s.enabled && this.s.pulse2.enabled && this.s.pulse2.dacEnabled && this.s.pulse2.frequencyLower != 0 && (this.s.pulse2.outputLeft || this.s.pulse2.outputRight)) {
            if (this.s.pulse2.updated) {
                this.pulsePan2.pan.value = this.s.pulse2.pan;
                this.pulseOsc2.mute = false;
                this.pulseOsc2.volume.value = -8;
                this.pulse2VolumeValue = this.s.pulse2.volume;
                this.pulseVolumeShaper2.setMap((i: number) => {
                    let mul = 1;
                    if (this.s.pulse2.width === 3) mul = -1;
                    return i * (this.pulse2VolumeValue / 15);
                });
                this.pulseOsc2.frequency.value = this.s.pulse2.frequencyHz;
                this.pulseOsc2.width.value = widths[this.s.pulse2.width];
            }
        } else {
            this.pulseOsc2.mute = true;
        }
    }

    wave() {
        if (this.ch3 && this.s.enabled && this.s.wave.enabled && this.s.wave.dacEnabled && this.s.wave.frequencyLower != 0 && (this.s.wave.outputLeft || this.s.wave.outputRight)) {
            if (this.s.wave.updated) {
                this.waveVolume.mute = false;

                this.wavePan.pan.value = this.s.wave.pan;
                this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 220;

                let mul = 0;
                switch (this.s.wave.volume) {
                    case 0: mul = 0; break;
                    case 1: mul = 1; break;
                    case 2: mul = 0.75; break;
                    case 3: mul = 0.50; break;
                }




                this.waveVolumeShaper.setMap((i: number) => {
                    return i * mul;
                });
            }
        } else {
            this.waveVolume.mute = true;
        }

    }

    updateWaveTable() {
        this.waveSrc.buffer.dispose();
        this.waveSrc.dispose();

        this.waveSrc = new Tone.BufferSource(this.s.wave.buffer, () => { });
        this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 220;
        this.waveSrc.loop = true;
        this.waveSrc.chain(this.waveVolume, this.waveVolumeShaper, this.wavePan, Tone.Master).start();
    }

    noise() {
        // Noise
        if (this.s.enabled && this.s.noise.enabled && this.s.noise.dacEnabled && (this.s.noise.outputLeft || this.s.noise.outputRight)) {
            if (this.s.noise.updated) {
                this.noiseVolumeShaper.setMap((i: number) => { return i * (this.s.noise.volume / 15); });

                this.noise7Pan.pan.value = this.s.noise.pan;
                this.noise15Pan.pan.value = this.s.noise.pan;

                let div = [8, 16, 32, 48, 64, 80, 96, 112][this.s.noise.divisorCode];
                let rate = 4194304 / (div << this.s.noise.shiftClockFrequency);

                if (this.s.noise.counterStep) {
                    // 7 bit noise
                    this.noise15Volume.mute = true;
                    this.noise7Volume.mute = false;

                    this.noise7Volume.volume.value = -12;

                    if (isFinite(rate))
                        this.noise7Src.playbackRate.value = rate / (48000 / 16);
                } else {
                    // 15 bit noise
                    this.noise15Volume.mute = false;
                    this.noise7Volume.mute = true;

                    this.noise15Volume.volume.value = -12;

                    if (isFinite(rate))
                        this.noise15Src.playbackRate.value = rate / (48000 / 16);
                }
            }
        } else {
            this.noise15Volume.mute = true;
            this.noise7Volume.mute = true;
        }

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