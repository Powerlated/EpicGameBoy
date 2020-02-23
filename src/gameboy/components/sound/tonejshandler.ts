class ToneJsHandler {
    pulseOsc1: Tone.PulseOscillator;
    pulsePan1: Tone.Panner;
    pulseOsc2: Tone.PulseOscillator;
    pulsePan2: Tone.Panner;
    waveSrc: Tone.BufferSource;
    wavePan: Tone.Panner;
    waveVolume: Tone.Volume;

    noiseSrc: Tone.BufferSource;
    noiseVolume: Tone.Volume;

    s: SoundChip

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

        this.waveSrc = new Tone.BufferSource(this.s.waveChannel.buffer, () => { });
        this.waveSrc.loop = true;
        this.waveVolume = new Tone.Volume();
        this.waveVolume.volume.value = -36;
        this.wavePan = new Tone.Panner(0);
        this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master);
        this.waveSrc.start();

        this.noiseSrc = new Tone.BufferSource(this.s.noiseChannel.buffer, () => { });
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
            if (this.s.pulseChannel1.enabled && this.s.pulseChannel1.frequencyLower != 0) {
                this.pulseOsc1.mute = false;
                this.pulseOsc1.volume.value = SoundChip.convertVolume(this.s.pulseChannel1.volume);
                this.pulseOsc1.frequency.value = this.s.pulseChannel1.frequencyHz;
                this.pulseOsc1.width.value = SoundChip.widths[this.s.pulseChannel1.width]
            } else {
                this.pulseOsc1.mute = true;
            }

            // Pulse 2
            if (this.s.pulseChannel2.enabled && this.s.pulseChannel2.frequencyLower != 0) {
                this.pulseOsc2.mute = false;
                this.pulseOsc2.volume.value = SoundChip.convertVolume(this.s.pulseChannel2.volume);
                this.pulseOsc2.frequency.value = this.s.pulseChannel2.frequencyHz;
                this.pulseOsc2.width.value = SoundChip.widths[this.s.pulseChannel2.width]
            } else {
                this.pulseOsc2.mute = true;
            }

            // Wave
            if (this.s.waveChannel.enabled && this.s.waveChannel.frequencyLower != 0) {
                this.waveVolume.mute = false;
                this.waveVolume.volume.value = SoundChip.convertVolumeWave(this.s.waveChannel.volume);
            } else {
                this.waveVolume.mute = true;
            }

            // Noise
            if (this.s.noiseChannel.enabled) {
                this.noiseVolume.mute = false;
                this.noiseVolume.volume.value = SoundChip.convertVolume(this.s.noiseChannel.volume);
            } else {
                this.noiseVolume.mute = true;
            }

            if (this.s.waveChannel.waveTableUpdated == true) {
                this.waveSrc.dispose();

                this.waveSrc = new Tone.BufferSource(this.s.waveChannel.buffer, () => { });
                this.waveSrc.loop = true;
                this.waveSrc.chain(this.wavePan, this.waveVolume, Tone.Master).start();

                this.s.waveChannel.waveTableUpdated = false;
            }

            this.pulsePan1.pan.value = this.s.pulseChannel1.pan;
            this.pulsePan2.pan.value = this.s.pulseChannel2.pan;
            this.wavePan.pan.value = this.s.waveChannel.pan;

    }
}