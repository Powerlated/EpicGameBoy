import SoundChip from "./sound";
import * as Tone from "tone";

const widths = [0.5, 0, -0.5, -0.75]; // CORRECT
// const widths = [0.75, 0.5, 0, 0.5]

function convertVolume(v: number) {
    const base = -12;
    let mute = 0;
    if (v === 0) mute = -10000;
    return base + mute + (6 * Math.log(v / 16));
}

function convertVolumeWave(v: number) {
    switch (v) {
        case 0: v = 0; break;
        case 1: v = 16; break;
        case 2: v = 10; break;
        case 3: v = 6; break;
    }

    const base = -14;
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

    noise7Src: Tone.BufferSource;
    noise7Volume: Tone.Volume;

    noise15Src: Tone.BufferSource;
    noise15Volume: Tone.Volume;

    noise7Pan: Tone.Panner;
    noise15Pan: Tone.Panner;




    masterVolume: Tone.Volume;

    s: SoundChip;

    constructor(s: SoundChip) {
        const highPass = new Tone.Filter(120, 'highpass', -12);
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
        this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master);
        this.waveSrc.start();


        this.noise7Src = new Tone.BufferSource(this.s.noise.buffer(true), () => { });
        this.noise7Src.loop = true;
        this.noise7Pan = new Tone.Panner(0);
        this.noise7Volume = new Tone.Volume();
        this.noise7Volume.mute = true;
        this.noise7Volume.volume.value = -1000;
        this.noise7Src.chain(this.noise7Pan, this.noise7Volume, Tone.Master);
        this.noise7Src.start();

        this.noise15Src = new Tone.BufferSource(this.s.noise.buffer(false), () => { });
        this.noise15Src.loop = true;
        this.noise15Pan = new Tone.Panner(0);
        this.noise15Volume = new Tone.Volume();
        this.noise15Volume.mute = true;
        this.noise15Volume.volume.value = -1000;
        this.noise15Src.chain(this.noise15Pan, this.noise15Volume, Tone.Master);
        this.noise15Src.start();
    }

    pulse1() {
        // Pulse 1
        if (this.s.pulse1.enabled && this.s.pulse1.enabled && this.s.pulse1.dacEnabled && this.s.pulse1.frequencyLower !== 0 && (this.s.pulse1.outputLeft || this.s.pulse1.outputRight)) {
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
        if (this.s.enabled && this.s.pulse2.enabled && this.s.pulse2.dacEnabled && this.s.pulse2.frequencyLower != 0 && (this.s.pulse2.outputLeft || this.s.pulse2.outputRight)) {
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
        if (this.s.enabled && this.s.wave.enabled && this.s.wave.dacEnabled && this.s.wave.frequencyLower != 0 && (this.s.wave.outputLeft || this.s.wave.outputRight)) {
            if (this.s.wave.updated) {
                this.wavePan.pan.value = this.s.wave.pan;
                this.waveVolume.mute = false;
                this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 220;
                this.waveVolume.volume.value = convertVolumeWave(this.s.wave.volume);
            }
        } else {
            this.waveVolume.mute = true;
        }


        if (this.s.wave.waveTableUpdated === true && this.s.gb.speedMul === 1) {
            this.waveSrc.disconnect(this.wavePan);
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
        if (this.s.enabled && this.s.noise.enabled && this.s.noise.dacEnabled && (this.s.noise.outputLeft || this.s.noise.outputRight)) {
            if (this.s.noise.updated) {
                this.noise7Pan.pan.value = this.s.noise.pan;
                this.noise15Pan.pan.value = this.s.noise.pan;

                let div = 0;
                switch (this.s.noise.divisorCode) {
                    case 0b000: div = 2; break;
                    case 0b001: div = 1; break;
                    case 0b010: div = 1 / 2; break;
                    case 0b011: div = 1 / 3; break;
                    case 0b100: div = 1 / 4; break;
                    case 0b101: div = 1 / 5; break;
                    case 0b110: div = 1 / 6; break;
                    case 0b111: div = 1 / 7; break;
                }

                if (this.s.noise.divisorCode == 0) this.s.noise.divisorCode = 0.5;

                let rate = ((4194304 / 8) / this.s.noise.divisorCode) / (2 ^ (this.s.noise.shiftClockFrequency + 1));

                if (this.s.noise.counterStep) {
                    // 7 bit noise
                    this.noise15Volume.mute = true;
                    this.noise7Volume.mute = false;

                    this.noise7Volume.volume.value = convertVolume(this.s.noise.volume);

                    if (isFinite(rate))
                        this.noise7Src.playbackRate.value = rate / (96000 / 4);
                } else {
                    // 15 bit noise
                    this.noise15Volume.mute = false;
                    this.noise7Volume.mute = true;

                    this.noise15Volume.volume.value = convertVolume(this.s.noise.volume);

                    if (isFinite(rate))
                        this.noise15Src.playbackRate.value = rate / (96000 / 4);
                }
            }
        } else {
            this.noise15Volume.mute = true;
            this.noise7Volume.mute = true;
        }

    }

    setMuted(muted: boolean) {
        Tone.Master.mute = muted;
    }
}