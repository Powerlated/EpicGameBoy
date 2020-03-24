import SoundChip from "./sound";
import * as Tone from "tone";

const widths = [0.5, 0, -0.5, -0.75]; // CORRECT
// const widths = [0.75, 0.5, 0, 0.5]

function convertVolume(v: number) {
    const base = -8;
    let mute = 0;
    if (v === 0) mute = -10000;
    return base + mute + (6 * Math.log(v / 16));
}

function convertVolumeWave(v: number) {
    switch (v) {
        case 0: v = 0; break;
        case 1: v = 16; break;
        case 2: v = 8; break;
        case 3: v = 4; break;
    }

    const base = -18;
    let mute = 0;
    if (v === 0) mute = -10000;
    return base + mute + (10 * Math.log(v / 16));
}

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
    noisePan: Tone.Panner;

    masterVolume: Tone.Volume;

    s: SoundChip;

    constructor(s: SoundChip) {
        const highPass = new Tone.Filter(120, 'highpass', -12);
        const bitCrush = new Tone.BitCrusher(4);
        this.masterVolume = new Tone.Volume();

        this.s = s;
        this.pulseOsc1 = new Tone.PulseOscillator(0, .5);
        this.pulseOsc1.volume.value = -36;
        this.pulsePan1 = new Tone.Panner(0);
        this.pulseOsc1.chain(this.pulsePan1, highPass, Tone.Master);
        this.pulseOsc1.start();

        this.pulseOsc2 = new Tone.PulseOscillator(0, 0.5);
        this.pulseOsc2.volume.value = -36;
        this.pulsePan2 = new Tone.Panner(0);
        this.pulseOsc2.chain(this.pulsePan2, highPass, Tone.Master);
        this.pulseOsc2.start();

        this.waveSrc = new Tone.BufferSource(this.s.wave.buffer, () => { });
        this.waveSrc.loop = true;
        this.waveVolume = new Tone.Volume();
        this.waveVolume.volume.value = -36;
        this.wavePan = new Tone.Panner(0);
        this.waveSrc.chain(this.wavePan, bitCrush, this.waveVolume, Tone.Master);
        this.waveSrc.start();

        this.noiseSrc = new Tone.BufferSource(this.s.noise.buffer, () => { });
        this.noiseSrc.loop = true;
        this.noiseVolume = new Tone.Volume();
        this.noiseVolume.mute = true;
        this.noisePan = new Tone.Panner(0);
        this.noiseVolume.volume.value = -1000;
        this.noiseSrc.chain(this.noisePan, this.noiseVolume, Tone.Master);
        this.noiseSrc.start();
    }

    pulse1() {
        // Pulse 1
        if (this.s.enabled && this.s.pulse1.enabled && this.s.pulse1.dacEnabled && this.s.pulse1.frequencyLower != 0) {
            if (this.s.pulse1.updated) {
                this.pulsePan1.pan.value = this.s.pulse1.pan;
                this.pulseOsc1.mute = false;
                this.pulseOsc1.volume.value = convertVolume(this.s.pulse1.volume);
                this.pulseOsc1.frequency.value = this.s.pulse1.frequencyHz;
                this.pulseOsc1.width.value = widths[this.s.pulse1.width];
            }
        } else {
            this.pulseOsc1.mute = true;
        }
    }

    pulse2() {
        // Pulse 2
        if (this.s.enabled && this.s.pulse2.enabled && this.s.pulse2.dacEnabled&& this.s.pulse2.frequencyLower != 0) {
            if (this.s.pulse2.updated) {
                this.pulsePan2.pan.value = this.s.pulse2.pan;
                this.pulseOsc2.mute = false;
                this.pulseOsc2.volume.value = convertVolume(this.s.pulse2.volume);
                this.pulseOsc2.frequency.value = this.s.pulse2.frequencyHz;
                this.pulseOsc2.width.value = widths[this.s.pulse2.width];
            }
        } else {
            this.pulseOsc2.mute = true;
        }
    }

    wave() {
        if (this.s.enabled && this.s.wave.enabled && this.s.wave.dacEnabled&& this.s.wave.frequencyLower != 0) {
            if (this.s.wave.updated) {
                this.wavePan.pan.value = this.s.wave.pan;
                this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 220;
                if (this.s.wave.enabled) {
                    this.waveVolume.mute = false;
                } else {
                    this.waveVolume.mute = true;
                }
                this.waveVolume.volume.value = convertVolumeWave(this.s.wave.volume);
            }
        } else {
            this.waveVolume.mute = true;
        }

        if (this.s.wave.waveTableUpdated === true) {
            this.waveSrc.dispose();

            this.waveSrc = new Tone.BufferSource(this.s.wave.buffer, () => { });
            this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 220;
            this.waveSrc.loop = true;
            this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master).start();

            this.s.wave.waveTableUpdated = false;
        }
    }

    noise() {
        // Noise
        if (this.s.enabled && this.s.noise.enabled) {
            if (this.s.noise.updated) {
                this.noiseVolume.mute = false;
                this.noisePan.pan.value = this.s.noise.pan;
                this.noiseVolume.volume.value = convertVolume(this.s.noise.volume);
            }
        } else {
            this.noiseVolume.mute = true;
        }

    }

    setMuted(muted: boolean) {
        Tone.Master.mute = muted;
    }
}