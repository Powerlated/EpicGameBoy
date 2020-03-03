import { PulseChannel, WaveChannel, NoiseChannel } from "./channels";
import ToneJsHandler from "./tonejshandler";
import * as Tone from "tone";
import GameBoy from "../../../gameboy";

export default class SoundChip {
    static lerp(v0: number, v1: number, t: number): number {
        return v0 * (1 - t) + v1 * t;
    }

    static convertVolume(v: number) {
        let base = -18;
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
    // static widths = [-0.75, -0.5, 0, 0.5]; // CORRECT
    static widths = [0.5, 0, -0.5, -0.75]; // CORRECT

    enabled = false;

    gb: GameBoy;
    clockMain = 0;
    clockEnvelope1 = 0;
    clockEnvelope2 = 0;
    clockEnvelopeNoise = 0;
    clockPulse1FreqSweep = 0;

    pulse1 = new PulseChannel();
    pulse2 = new PulseChannel();
    wave = new WaveChannel();
    noise = new NoiseChannel();

    tjs = new ToneJsHandler(this);

    constructor(gb: GameBoy) {
        this.gb = gb;

        // Tone.context.latencyHint = "fastest"
        Tone.context.lookAhead = 0;
    }

    step() {
        if (!this.enabled) return;

        // #region CLOCK
        const CLOCK_MAIN_STEPS = 16384;
        const CLOCK_ENVELOPE_STEPS = 16384;

        this.clockMain += this.gb.cpu.lastInstructionCycles / 4;
        this.clockEnvelope1 += (this.gb.cpu.lastInstructionCycles / 4) / this.pulse1.volumeEnvelopeSweep; // 16384 hz, divide as needed 
        this.clockEnvelope2 += (this.gb.cpu.lastInstructionCycles / 4) / this.pulse2.volumeEnvelopeSweep; // 16384 hz, divide as needed
        this.clockEnvelopeNoise += (this.gb.cpu.lastInstructionCycles / 4) / this.noise.volumeEnvelopeSweep; // 16384 hz, divide as needed

        if (this.clockEnvelope1 >= CLOCK_ENVELOPE_STEPS) {
            if (this.pulse1.volumeEnvelopeSweep != 0) {
                if (this.pulse1.volume > 0 && this.pulse1.volume < 16 && this.pulse1.frequencyHz != 64) {
                    if (this.pulse1.volumeEnvelopeUp) {
                        this.pulse1.volume++;
                    } else {
                        this.pulse1.volume--;
                    }
                }
            }
            this.clockEnvelope1 = 0;
        }

        if (this.clockEnvelope2 >= CLOCK_ENVELOPE_STEPS) {
            if (this.pulse2.volumeEnvelopeSweep != 0) {
                if (this.pulse2.volume > 0 && this.pulse2.volume < 16 && this.pulse1.frequencyHz != 64) {
                    if (this.pulse2.volumeEnvelopeUp) {
                        this.pulse2.volume++;
                    } else {
                        this.pulse2.volume--;
                    }
                }
            }
            this.clockEnvelope2 = 0;
        }

        if (this.clockEnvelopeNoise >= CLOCK_ENVELOPE_STEPS) {
            if (this.noise.volumeEnvelopeSweep != 0) {
                if (this.noise.volume > 0 && this.noise.volume < 16) {
                    if (this.noise.volumeEnvelopeUp) {
                        this.noise.volume++;
                    } else {
                        this.noise.volume--;
                    }
                }
            }
            this.clockEnvelopeNoise = 0;
        }
        // #endregion

        // 1048576hz Divide by 4096 = 256hz
        if (this.clockMain >= CLOCK_MAIN_STEPS) {
            // #region TRIGGERS
            if (this.pulse1.triggered) this.pulse1.trigger();
            if (this.pulse2.triggered) this.pulse2.trigger();
            if (this.wave.triggered) this.wave.trigger();
            if (this.noise.triggered) this.noise.trigger();
            this.pulse1.triggered = false;
            this.pulse2.triggered = false;
            this.wave.triggered = false;
            this.noise.triggered = false;
            // #endregion

            // #region LENGTH
            if (this.pulse1.enabled) {
                if (this.pulse1.lengthEnable) {
                    this.pulse1.lengthCounter--;
                    if (this.pulse1.lengthCounter == 0) {
                        this.pulse1.enabled = false;
                    }
                }
                if (this.pulse1.freqSweepTime != 0) {
                    // writeDebug("Frequency sweep")
                    if (this.clockPulse1FreqSweep > this.pulse1.freqSweepTime) {
                        this.clockPulse1FreqSweep = 0;
                        let freq = (this.pulse1.frequencyUpper << 8) | this.pulse1.frequencyLower;
                        let diff = freq / (2 ^ this.pulse1.freqSweepShiftNum);
                        this.pulse1.freqSweepUp == false ? freq += diff : freq -= diff;
                        this.pulse1.frequencyLower = freq & 0xFF;
                        this.pulse1.frequencyUpper = (freq >> 8) & 0xFF;
                        // writeDebug("abs(Range): " + diff);
                        // writeDebug("Resulting frequency: " + this.pulse1.frequencyHz);
                    }
                    this.clockPulse1FreqSweep++;
                }
            }

            if (this.pulse2.enabled) {
                if (this.pulse2.lengthEnable) {
                    this.pulse2.lengthCounter--;
                    if (this.pulse2.lengthCounter == 0) {
                        this.pulse2.enabled = false;
                    }
                }
            }

            // TODO: Wave length isn't working in some way or another
            if (this.wave.enabled) {
                if (this.wave.lengthEnable) {
                    console.log("WAVE LENGTH: " + this.wave.lengthCounter);
                    this.wave.lengthCounter--;
                    if (this.wave.lengthCounter == 0) {
                        console.log("WAVE EXPIRED");
                        this.wave.playing = false;
                    }
                }
            }

            if (this.noise.enabled) {
                if (this.noise.lengthEnable) {
                    this.noise.lengthCounter--;
                    if (this.noise.lengthCounter == 0) {
                        this.noise.enabled = false;
                    }
                }
            }

            // this.noiseOsc.mute = !this.noiseChannel.enabled

            // #endregion

            // Update Tone.js
            this.tjs.step();
        }


        this.clockMain %= CLOCK_MAIN_STEPS;
    }

    soundRegisters = new Uint8Array(65536).fill(0);

    write(addr: number, value: number) {
        let dutyCycle = 0;
        this.soundRegisters[addr] = value;
        switch (addr) {

            // Pulse 1
            case 0xFF10: // NR10
                this.pulse1.freqSweepTime = (value & 0b01110000) >> 4; // in 128ths of a second (0-7)
                this.pulse1.freqSweepUp = ((value >> 3) & 1) == 0; // 0 == Add, 1 = Sub
                this.pulse1.freqSweepShiftNum = (value & 0b111); // 0-7; 
                this.pulse1.update();
                break;
            case 0xFF11: // NR11
                this.pulse1.width = (value & 0b11000000) >> 6;
                this.pulse1.lengthCounter = 64 - (value & 0b111111);
                this.pulse1.update();
                break;
            case 0xFF12: // NR12
                this.pulse1.volume = (value >> 4) & 0xF;
                this.pulse1.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.pulse1.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.pulse1.volumeEnvelopeSweep = value & 0b111;
                this.pulse1.update();
                break;
            case 0xFF13: // NR13 Low bits
                this.pulse1.oldFrequencyLower = this.pulse1.frequencyLower;
                this.pulse1.frequencyLower = value;
                this.pulse1.update();
                break;
            case 0xFF14: // NR14
                this.pulse1.frequencyUpper = value & 0b111;
                this.pulse1.lengthEnable = ((value >> 6) & 1) != 0;
                this.pulse1.triggered = ((value >> 7) & 1) != 0;
                this.pulse1.update();
                break;

            // Pulse 2
            case 0xFF16: // NR21
                this.pulse2.width = (value & 0b11000000) >> 6;
                this.pulse2.lengthCounter = 64 - (value & 0b111111);
                this.pulse2.update();
                break;
            case 0xFF17: // NR22
                this.pulse2.volume = (value >> 4) & 0xF;
                this.pulse2.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.pulse2.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.pulse2.volumeEnvelopeSweep = value & 0b111;
                this.pulse2.update();
                break;
            case 0xFF18: // NR23
                this.pulse2.oldFrequencyLower = this.pulse2.frequencyLower;
                this.pulse2.frequencyLower = value;
                this.pulse2.update();
                break;
            case 0xFF19: // NR24
                this.pulse2.frequencyUpper = value & 0b111;
                this.pulse2.lengthEnable = ((value >> 6) & 1) != 0;
                this.pulse2.triggered = ((value >> 7) & 1) != 0;
                this.pulse2.update();
                break;

            // Wave
            case 0xFF1A: // NR30
                if ((value & (1 << 7)) != 0) {
                    this.wave.playing = true;
                } else {
                    this.wave.playing = false;
                }
                this.wave.update();
                break;
            case 0xFF1B: // NR31
                this.wave.lengthCounter = 256 - value;
                this.wave.update();
                break;
            case 0xFF1C: // NR32
                this.wave.volume = (value >> 5) & 0b11;
                this.wave.update();
                break;
            case 0xFF1D: // NR33
                this.wave.frequencyLower = value;
                this.wave.update();
                break;
            case 0xFF1E: // NR34
                this.wave.frequencyUpper = value & 0b111;
                this.wave.triggered = ((value >> 7) & 1) != 0;
                this.wave.lengthEnable = ((value >> 6) & 1) != 0;
                this.wave.update();
                break;

            // Noise
            case 0xFF20: // NR41
                this.noise.lengthCounter = 64 - (value & 0b111111); // 6 bits
                this.noise.update();
                break;
            case 0xFF21: // NR42
                this.noise.volume = (value >> 4) & 0xF;
                this.noise.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.noise.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.noise.volumeEnvelopeSweep = value & 0b111;
                this.noise.update();
                break;
            case 0xFF22: // NR43
                this.noise.update();
                break;
            case 0xFF23: // NR44
                this.noise.triggered = ((value >> 7) & 1) != 0;
                this.noise.lengthEnable = ((value >> 6) & 1) != 0;
                this.noise.update();
                break;


            case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
            case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                const BASE = 0xFF30;
                this.wave.waveTable[((addr - BASE) * 2) + 0] = value >> 4;
                this.wave.waveTable[((addr - BASE) * 2) + 1] = value & 0xF;
                this.wave.waveTableUpdated = true;
                this.wave.update();
                break;

            // Panning
            case 0xFF25:
                this.noise.outputRight = (((value >> 7) & 1) == 1);
                this.wave.outputRight = (((value >> 6) & 1) == 1);
                this.pulse2.outputRight = (((value >> 5) & 1) == 1);
                this.pulse1.outputRight = (((value >> 4) & 1) == 1);

                this.noise.outputLeft = (((value >> 3) & 1) == 1);
                this.wave.outputLeft = (((value >> 2) & 1) == 1);
                this.pulse2.outputLeft = (((value >> 1) & 1) == 1);
                this.pulse1.outputLeft = (((value >> 0) & 1) == 1);

                break;

            // Control
            case 0xFF26: // NR52
                if (((value >> 7) & 1) != 0) {
                    this.enabled = true;
                    // writeDebug("Enabled sound");
                } else {
                    // writeDebug("Disabled sound");
                    this.enabled = false;
                    break;
                }
                break;
        }
    }

    read(addr: number): number {
        let i = this.soundRegisters[addr];
        switch (addr & 0xFF) {
            case 0x10: i |= 0x80; break;
            case 0x11: i |= 0x3F; break;
            case 0x12: i |= 0x00; break;
            case 0x13: i |= 0xFF; break;
            case 0x14: i |= 0xBF; break;

            case 0x15: i |= 0xFF; break;
            case 0x16: i |= 0x3F; break;
            case 0x17: i |= 0x00; break;
            case 0x18: i |= 0xFF; break;
            case 0x19: i |= 0xBF; break;

            case 0x1A: i |= 0x7F; break;
            case 0x1B: i |= 0xFF; break;
            case 0x1C: i |= 0x9F; break;
            case 0x1D: i |= 0xFF; break;
            case 0x1E: i |= 0xBF; break;

            case 0x1F: i |= 0xFF; break;
            case 0x20: i |= 0xFF; break;
            case 0x21: i |= 0x00; break;
            case 0x22: i |= 0x00; break;
            case 0x23: i |= 0xBF; break;

            case 0x24: i |= 0x00; break;
            case 0x25: i |= 0x00; break;
            case 0x26: i |= 0x70; break;
        }

        if (addr >= 0xFF27 && addr <= 0xFF2F) i = 0xFF;

        if (addr == 0xFF52) { // NR52
            return 0;
            if (this.enabled) i |= (1 << 7);
            if (this.noise) i |= (1 << 3);
            if (this.wave) i |= (1 << 2);
            if (this.pulse2) i |= (1 << 1);
            if (this.pulse1) i |= (1 << 0);
        }

        return i;
    }

    reset() {
        this.enabled = false;

        this.pulse1 = new PulseChannel();
        this.pulse2 = new PulseChannel();
        this.wave = new WaveChannel();
        this.noise = new NoiseChannel();

        this.clockMain = 0;
        this.clockEnvelope1 = 0;
        this.clockEnvelope2 = 0;
    }

    setMuted(muted: boolean) {
        this.enabled = !muted;
        this.tjs.pulseOsc1.mute = muted;
        this.tjs.pulseOsc2.mute = muted;
        this.tjs.waveVolume.mute = muted;
        this.tjs.noiseVolume.mute = muted;
    }
}