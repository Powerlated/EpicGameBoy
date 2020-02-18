class PulseChannel {
    frequencyUpper = 0; // Frequency = 131072/(2048-x) Hz
    frequencyLower = 0;
    oldFrequencyLower = 0;
    oldFrequencyHz = 0;

    volume = 0; // 4-bit value 0-15
    volumeEnvelopeUp = false;
    volumeEnvelopeSweep = 4;
    volumeEnvelopeStart = 0;

    oldVolume = 0;

    outputLeft = false;
    outputRight = false;

    get enabled(): boolean {
        return (this.outputLeft || this.outputRight) && this.frequencyHz != 64;
    }

    get pan(): number {
        if (this.outputLeft && !this.outputRight) {
            return -1;
        }
        if (this.outputRight && !this.outputLeft) {
            return 1;
        }
        if (this.outputLeft && this.outputRight) {
            return 0;
        }
        return 0;
    }

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

    waveTable: Array<number> = [];

    restartSound = false;
    soundExpires = false;
    soundLength = 0;

    outputLeft = false;
    outputRight = false;

    get enabled(): boolean {
        return (this.outputLeft || this.outputRight) && this.frequencyHz != 64;
    }

    get pan(): number {
        if (this.outputLeft && !this.outputRight) {
            return -1;
        }
        if (this.outputRight && !this.outputLeft) {
            return 1;
        }
        if (this.outputLeft && this.outputRight) {
            return 0;
        }
        return 0;
    }

    get frequencyHz(): number {
        let frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return (65536 / (2048 - frequency));
    }
}

class NoiseChannel {
    outputLeft = false;
    outputRight = false;

    get enabled(): boolean {
        return this.outputLeft || this.outputRight;
    }

    get pan(): number {
        if (this.outputLeft && !this.outputRight) {
            return -1;
        }
        if (this.outputRight && !this.outputLeft) {
            return 1;
        }
        if (this.outputLeft && this.outputRight) {
            return 0;
        }
        return 0;
    }
}

class SoundChip {
    static lerp(v0: number, v1: number, t: number): number {
        return v0 * (1 - t) + v1 * t;
    }

    static convertVolume(v: number) {
        let base = -12;
        let mute = 0;
        if (v == 0) mute = -10000;
        return base + mute + (6 * Math.log(v / 16));
    }

    static convertVolumeWave(v: number) {
        switch (v) {
            case 0: v = 0; break;
            case 1: v = 16; break;
            case 2: v = 8; break;
            case 3: v = 4; break;
        }

        let base = -18;
        let mute = 0;
        if (v == 0) mute = -10000;
        return base + mute + (10 * Math.log(v / 16));
    }

    // 0 = 50% Duty Cycle
    // static widths = [0.125, 0.25, 0.50, 0.75]; // WRONG
    static widths = [-0.75, -0.5, 0, 0.5]; // CORRECT

    enabled = false;

    gb: GameBoy;
    clockMain = 0;
    clockEnvelope1 = 0;
    clockEnvelope2 = 0;

    pulseChannel1 = new PulseChannel();
    pulseChannel2 = new PulseChannel();
    waveChannel = new WaveChannel();
    noiseChannel = new NoiseChannel();

    pulseOsc1: Tone.PulseOscillator;
    pulsePan1: Tone.Panner;
    pulseOsc2: Tone.PulseOscillator;
    pulsePan2: Tone.Panner;
    waveOsc: Tone.Oscillator;
    wavePan: Tone.Panner;

    constructor(gb: GameBoy) {
        this.gb = gb;

        let bitCrusher = new Tone.BitCrusher(4);

        this.pulseOsc1 = new Tone.PulseOscillator(0, .5);
        this.pulseOsc1.volume.value = -36;
        this.pulsePan1 = new Tone.Panner(0);
        this.pulseOsc1.chain(this.pulsePan1, bitCrusher, Tone.Master);
        this.pulseOsc1.start();

        this.pulseOsc2 = new Tone.PulseOscillator(0, 0.5);
        this.pulseOsc2.volume.value = -36;
        this.pulsePan2 = new Tone.Panner(0);
        this.pulseOsc2.chain(this.pulsePan2, bitCrusher, Tone.Master);
        this.pulseOsc2.start();

        this.waveOsc = new Tone.Oscillator(0, "triangle");
        this.waveOsc.volume.value = -36;
        this.wavePan = new Tone.Panner(0);
        this.waveOsc.chain(this.wavePan, bitCrusher, Tone.Master);
        this.waveOsc.toMaster();
        this.waveOsc.start();

        //play a middle 'C' for the duration of an 8th note
    }

    step() {
        if (!this.enabled) return;

        const CLOCK_MAIN_STEPS = 16384;
        const CLOCK_ENVELOPE_STEPS = 16384;

        this.clockMain += this.gb.cpu.lastInstructionCycles / 4;
        this.clockEnvelope1 += (this.gb.cpu.lastInstructionCycles / 4) / this.pulseChannel1.volumeEnvelopeSweep; // 16384 hz, divide as needed 
        this.clockEnvelope2 += (this.gb.cpu.lastInstructionCycles / 4) / this.pulseChannel2.volumeEnvelopeSweep; // 16384 hz, divide as needed

        if (this.clockEnvelope1 >= CLOCK_ENVELOPE_STEPS) {
            if (this.pulseChannel1.volumeEnvelopeSweep != 0) {
                if (this.pulseChannel1.volume > 0 && this.pulseChannel1.volume < 16 && this.pulseChannel1.frequencyHz != 64) {
                    if (this.pulseChannel1.volumeEnvelopeUp) {
                        this.pulseChannel1.volume++;
                    } else {
                        this.pulseChannel1.volume--;
                    }
                }
            }
            this.clockEnvelope1 = 0;
        }

        if (this.clockEnvelope2 >= CLOCK_ENVELOPE_STEPS) {
            if (this.pulseChannel2.volumeEnvelopeSweep != 0) {
                if (this.pulseChannel2.volume > 0 && this.pulseChannel2.volume < 16 && this.pulseChannel1.frequencyHz != 64) {
                    if (this.pulseChannel2.volumeEnvelopeUp) {
                        this.pulseChannel2.volume++;
                    } else {
                        this.pulseChannel2.volume--;
                    }
                }
            }
            this.clockEnvelope2 = 0;
        }

        // 1048576hz Divide by 4096 = 256hz
        if (this.clockMain >= CLOCK_MAIN_STEPS) {

            if (this.pulseChannel1.enabled) {
                // Pulse 1
                this.pulseOsc1.volume.value = SoundChip.convertVolume(this.pulseChannel1.volume);
                this.pulseOsc1.frequency.value = this.pulseChannel1.frequencyHz;
            } else {
                this.pulseOsc1.volume.value = -1000000;
            }

            if (this.pulseChannel2.enabled) {
                // Pulse 2
                this.pulseOsc2.volume.value = SoundChip.convertVolume(this.pulseChannel2.volume);
                this.pulseOsc2.frequency.value = this.pulseChannel2.frequencyHz;
            } else {
                this.pulseOsc2.volume.value = -1000000;
            }

            if (this.waveChannel.enabled) {
                // Wave
                this.waveOsc.frequency.value = this.waveChannel.frequencyHz;

                if (this.waveChannel.soundLength > 0 && this.waveChannel.soundExpires) {
                    this.waveChannel.soundLength--;
                }
                if (this.waveChannel.soundLength > 0 || !this.waveChannel.soundExpires) {
                    this.waveOsc.volume.value = SoundChip.convertVolumeWave(this.waveChannel.volume);
                } else {
                    this.waveOsc.volume.value = 0;
                }
            } else {
                this.waveOsc.volume.value = -1000000;
            }

            this.pulsePan1.pan.value = this.pulseChannel1.pan;
            this.pulsePan2.pan.value = this.pulseChannel2.pan;
            this.wavePan.pan.value = this.waveChannel.pan;

            // this.noiseOsc.mute = !this.noiseChannel.enabled
        }

        this.clockMain %= CLOCK_MAIN_STEPS;
    }

    write(addr: number, value: number) {
        let dutyCycle = 0;
        switch (addr) {

            // Pulse 1
            case 0xFF10: break;
            case 0xFF11:
                dutyCycle = (value & 0b11000000) >> 6;
                this.pulseOsc1.width.value = SoundChip.widths[dutyCycle];
                break;
            case 0xFF12:
                this.pulseChannel1.volume = (value >> 4) & 0xF;
                this.pulseChannel1.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.pulseChannel1.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.pulseChannel1.volumeEnvelopeSweep = value & 0b111;
                break;
            case 0xFF13: // Low bits
                this.pulseChannel1.oldFrequencyLower = this.pulseChannel1.frequencyLower;
                this.pulseChannel1.frequencyLower = value;

                // If the Hz difference between the old and the new frequencies is higher than 4, attack
                if (Math.abs(this.pulseChannel1.oldFrequencyLower - this.pulseChannel1.frequencyLower) > 4) {
                    this.pulseChannel1.volume = this.pulseChannel1.volumeEnvelopeStart;
                }

                break;
            case 0xFF14:
                this.pulseChannel1.frequencyUpper = value & 0b111;
                break;

            // Pulse 2
            case 0xFF16:
                dutyCycle = (value & 0b11000000) >> 6;
                this.pulseOsc2.width.value = SoundChip.widths[dutyCycle];
                break;
            case 0xFF17:
                this.pulseChannel2.volume = (value >> 4) & 0xF;
                this.pulseChannel2.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.pulseChannel2.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.pulseChannel2.volumeEnvelopeSweep = value & 0b111;
                break;
            case 0xFF18:
                this.pulseChannel2.oldFrequencyLower = this.pulseChannel2.frequencyLower;
                this.pulseChannel2.frequencyLower = value;

                // If the Hz difference between the old and the new frequencies is higher than 4, attack
                if (Math.abs(this.pulseChannel2.oldFrequencyLower - this.pulseChannel2.frequencyLower) > 4) {
                    this.pulseChannel2.volume = this.pulseChannel2.volumeEnvelopeStart;
                }
                break;
            case 0xFF19:
                this.pulseChannel2.frequencyUpper = value & 0b111;
                break;

            // Wave
            case 0xFF1A: break;
            case 0xFF1B:
                this.waveChannel.soundLength = 256 - value;
                break;
            case 0xFF1C:
                this.waveChannel.volume = (value >> 5) & 0b11;
                break;
            case 0xFF1D:
                this.waveChannel.frequencyLower = value;
                break;
            case 0xFF1E:
                this.waveChannel.frequencyUpper = value & 0b111;
                this.waveChannel.restartSound = ((value >> 7) & 1) == 1;
                this.waveChannel.soundExpires = ((value >> 6) & 1) == 1;
                break;

            case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
            case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                let base = 0xFF30;
                this.waveChannel.waveTable[((addr - base) * 2) + 0] = value >> 4;
                this.waveChannel.waveTable[((addr - base) * 2) + 1] = value & 0xF;
                break;

            // Panning
            case 0xFF25:
                this.noiseChannel.outputRight = (((value >> 7) & 1) == 1);
                this.waveChannel.outputRight = (((value >> 6) & 1) == 1);
                this.pulseChannel2.outputRight = (((value >> 5) & 1) == 1);
                this.pulseChannel1.outputRight = (((value >> 4) & 1) == 1);

                this.noiseChannel.outputLeft = (((value >> 3) & 1) == 1);
                this.waveChannel.outputLeft = (((value >> 2) & 1) == 1);
                this.pulseChannel2.outputLeft = (((value >> 1) & 1) == 1);
                this.pulseChannel1.outputLeft = (((value >> 0) & 1) == 1);

                break;

            // Control
            case 0xFF26:
                if (((value >> 7) & 1) == 1) {
                    this.enabled = true;
                    console.log("Enabled sound");
                    this.pulseOsc1.mute = false;
                    this.pulseOsc2.mute = false;
                    this.waveOsc.mute = false;
                } else {
                    console.log("Disabled sound");
                    this.enabled = false;
                    this.pulseOsc1.mute = true;
                    this.pulseOsc2.mute = true;
                    this.waveOsc.mute = true;
                }
                break;
        }
    }

    read(addr: number) {

    }

    reset() {
        this.enabled = false;

        this.pulseChannel1 = new PulseChannel();
        this.pulseChannel2 = new PulseChannel();
        this.waveChannel = new WaveChannel();

        this.clockMain = 0;
        this.clockEnvelope1 = 0;
        this.clockEnvelope2 = 0;
    }

    setMuted(muted: boolean) {
        this.enabled = !muted;
        this.pulseOsc1.mute = muted;
        this.pulseOsc2.mute = muted;
        this.waveOsc.mute = muted;
    }
}