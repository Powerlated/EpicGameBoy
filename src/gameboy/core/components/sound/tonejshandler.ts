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
        let highPass = new Tone.Filter(160, 'highpass', -12);
        let bitCrush = new Tone.BitCrusher(4);

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
        this.noiseSrc.chain(this.noiseVolume, Tone.Master);
        this.noiseSrc.start();
    }

    step() {
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
            this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 440;
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

            this.waveSrc = new Tone.BufferSource(this.s.wave.buffer, () => { });
            this.waveSrc.playbackRate.value = this.s.wave.frequencyHz / 440;
            this.waveSrc.loop = true;
            this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master).start();

            this.s.wave.waveTableUpdated = false;
        }

        this.pulsePan1.pan.value = this.s.pulse1.pan;
        this.pulsePan2.pan.value = this.s.pulse2.pan;
        this.wavePan.pan.value = this.s.wave.pan;

    }
}