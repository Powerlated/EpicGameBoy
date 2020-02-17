class PulseChannel {
    frequencyUpper = 0; // Frequency = 131072/(2048-x) Hz
    frequencyLower = 0;
    oldFrequencyHz = 0;

    volume = 0;
    oldVolume = 0;

    get frequencyHz(): number {
        let frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return 131072 / (2048 - frequency);
    }
}

class WaveChannel {
    frequencyUpper = 0;
    frequencyLower = 0;
    oldFrequencyHz = 0;

    volume = 0;
    oldVolume = 0;

    get frequencyHz(): number {
        let frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return 131072 / (2048 - frequency);
    }
}



class SoundChip {
    static lerp(v0, v1, t) {
        return v0 * (1 - t) + v1 * t;
    }

    static convertVolume(v: number) {
        let base = -18;
        let mute = 0;
        if (v == 0) mute = -10000;
        return base + mute + this.lerp(0, 0, v);
    }

    static widths = [0.125, 0.25, 0.50, 0.75];

    gb: GameBoy;
    clock = 0;

    pulseChannel0 = new PulseChannel();
    pulseChannel1 = new PulseChannel();
    waveChannel = new WaveChannel();

    pulseOsc0: Tone.PulseOscillator;
    pulseOsc1: Tone.PulseOscillator;
    waveOsc: Tone.Oscillator;

    constructor(gb: GameBoy) {
        this.gb = gb;

        this.pulseOsc0 = new Tone.PulseOscillator(0, .5);
        this.pulseOsc0.volume.value = -36;
        this.pulseOsc0.toMaster();
        this.pulseOsc0.start();

        this.pulseOsc1 = new Tone.PulseOscillator(0, .5);
        this.pulseOsc1.volume.value = -36;
        this.pulseOsc1.toMaster();
        // this.pulseOsc1.start();

        this.waveOsc = new Tone.Oscillator(0, "triangle");
        this.waveOsc.volume.value = -36;
        this.waveOsc.toMaster();
        // this.waveOsc.start();

        //play a middle 'C' for the duration of an 8th note
    }

    step() {
        this.clock += this.gb.cpu.lastInstructionCycles / 4;

        // 1048576hz Divide by 16384 = 64hz
        if (this.clock >= 16) {
            this.clock = 0;

            if ((this.pulseChannel0.frequencyHz != this.pulseChannel0.oldFrequencyHz) &&
                (this.pulseChannel0.volume != this.pulseChannel0.oldVolume)) {
                this.pulseOsc0.volume.value = SoundChip.convertVolume(this.pulseChannel0.volume);
                this.pulseOsc0.frequency.value = this.pulseChannel0.frequencyHz;

                this.pulseChannel0.oldFrequencyHz = this.pulseChannel0.frequencyHz;
                this.pulseChannel0.oldVolume = this.pulseChannel0.volume;
                console.log("0 CHANGE")
            }

            if ((this.pulseChannel1.frequencyHz != this.pulseChannel1.oldFrequencyHz) &&
                (this.pulseChannel1.volume != this.pulseChannel1.oldVolume)) {
                this.pulseOsc1.volume.value = SoundChip.convertVolume(this.pulseChannel1.volume);
                this.pulseOsc1.frequency.value = this.pulseChannel1.frequencyHz;

                this.pulseChannel1.oldFrequencyHz = this.pulseChannel1.frequencyHz;
                this.pulseChannel1.oldVolume= this.pulseChannel1.volume;
            }

            if ((this.waveChannel.frequencyHz != this.waveChannel.oldFrequencyHz) &&
                (this.waveChannel.volume != this.waveChannel.oldVolume)) {
                this.waveOsc.volume.value = SoundChip.convertVolume(this.waveChannel.volume);

                this.waveChannel.oldFrequencyHz = this.waveChannel.frequencyHz;
                this.waveChannel.oldVolume= this.waveChannel.volume;
            }


        }
    }

    write(addr: number, value: number) {
        let dutyCycle = 0;
        switch (addr) {

            // Pulse 1
            case 0xFF10: break;
            case 0xFF11:
                dutyCycle = (value & 0b11000000) >> 6;
                this.pulseOsc0.width.value = SoundChip.widths[dutyCycle];
                break;
            case 0xFF12:
                this.pulseChannel0.volume = (value >> 4) & 0xF;
                break;
            case 0xFF13: // Low bits
                this.pulseChannel0.frequencyLower = value;
                break;
            case 0xFF14:
                this.pulseChannel0.frequencyUpper = value & 0b111;
                break;

            // Pulse 2
            case 0xFF16:
                dutyCycle = (value & 0b11000000) >> 6;
                this.pulseOsc1.width.value = SoundChip.widths[dutyCycle];
                break;
            case 0xFF17:
                this.pulseChannel1.volume = (value >> 4) & 0xF;
                break;
            case 0xFF18:
                this.pulseChannel1.frequencyLower = value;
                break;
            case 0xFF19:
                this.pulseChannel1.frequencyUpper = value & 0b111;
                break;

            // Wave
            case 0xFF1A: break;
            case 0xFF1B: break;
            case 0xFF1C: break;
            case 0xFF18:
                this.waveChannel.frequencyLower = value;
                break;
            case 0xFF19:
                this.waveChannel.frequencyUpper = value & 0b111;
                break;
        }
    }

    read(addr: number) {

    }

    reset() {

    }
}