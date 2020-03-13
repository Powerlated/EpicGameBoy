import { PulseChannel, WaveChannel, NoiseChannel } from "./channels";
import ToneJsHandler from "./tonejshandler";
import * as Tone from "tone";
import GameBoy from "../../../gameboy";
import { writeDebug } from "../../../tools/debug";

export default class SoundChip {
    static lerp(v0: number, v1: number, t: number): number {
        return v0 * (1 - t) + v1 * t;
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
        if (this.gb.cpu.cycles % this.gb.speedMul != 0) return;
        if (!this.enabled) return;

        // #region CLOCK
        const CLOCK_MAIN_STEPS = 65536;
        const CLOCK_ENVELOPE_STEPS = 65536;

        this.clockMain += this.gb.cpu.lastInstructionCycles;
        this.clockEnvelope1 += this.gb.cpu.lastInstructionCycles / this.pulse1.volumeEnvelopeSweep; // 16384 hz, divide as needed 
        this.clockEnvelope2 += this.gb.cpu.lastInstructionCycles / this.pulse2.volumeEnvelopeSweep; // 16384 hz, divide as needed
        this.clockEnvelopeNoise += this.gb.cpu.lastInstructionCycles / this.noise.volumeEnvelopeSweep; // 16384 hz, divide as need

        // 4194304hz Divide by 65536 = 64hz
        if (this.clockMain >= CLOCK_MAIN_STEPS) {
            if (this.clockEnvelope1 >= CLOCK_ENVELOPE_STEPS) {
                if (this.pulse1.volumeEnvelopeSweep != 0) {
                    if (this.pulse1.volume > 0 && this.pulse1.volume < 16 && this.pulse1.frequencyHz != 64) {
                        if (this.pulse1.volumeEnvelopeUp) {
                            this.pulse1.volume++;
                        } else {
                            this.pulse1.volume--;
                        }
                        this.pulse1.update();
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
                        this.pulse2.update();
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
                        this.noise.update();
                    }
                }
                this.clockEnvelopeNoise = 0;
            }

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
                    if (this.pulse1.lengthCounter === 0) {
                        writeDebug("PULSE 1 length become 0");
                        this.pulse1.enabled = false;
                        this.pulse1.update();
                    }
                }
                if (this.pulse1.freqSweepTime != 0) {
                    // writeDebug("Frequency sweep")
                    if (this.clockPulse1FreqSweep > this.pulse1.freqSweepTime) {
                        this.clockPulse1FreqSweep = 0;
                        let freq = (this.pulse1.frequencyUpper << 8) | this.pulse1.frequencyLower;
                        let diff = freq / (2 ^ this.pulse1.freqSweepShiftNum);
                        this.pulse1.freqSweepUp === false ? freq += diff : freq -= diff;
                        this.pulse1.frequencyLower = freq & 0xFF;
                        this.pulse1.frequencyUpper = (freq >> 8) & 0xFF;
                        this.pulse1.update();
                        // writeDebug("abs(Range): " + diff);
                        // writeDebug("Resulting frequency: " + this.pulse1.frequencyHz);
                    }
                    this.clockPulse1FreqSweep++;
                }
            }

            if (this.pulse2.enabled) {
                if (this.pulse2.lengthEnable) {
                    this.pulse2.lengthCounter--;
                    if (this.pulse2.lengthCounter === 0) {
                        this.pulse2.enabled = false;
                        this.pulse2.update();
                    }
                }
            }

            // TODO: Wave length isn't working in some way or another
            if (this.wave.enabled) {
                if (this.wave.lengthEnable) {
                    this.wave.lengthCounter--;
                    if (this.wave.lengthCounter <= 0) {
                        this.wave.playing = false;
                        this.wave.update();
                    }
                }
            }

            if (this.noise.enabled) {
                if (this.noise.lengthEnable) {
                    this.noise.lengthCounter--;
                    if (this.noise.lengthCounter === 0) {
                        this.noise.enabled = false;
                        this.noise.update();
                    }
                }
            }

            // this.noiseOsc.mute = !this.noiseChannel.enabled

            // #endregion

            // Update Tone.js
            if (
                this.pulse1.updated ||
                this.pulse2.updated ||
                this.wave.updated ||
                this.noise.updated
            ) {
                this.tjs.step();
                this.pulse1.updated = false;
                this.pulse2.updated = false;
                this.wave.updated = false;
                this.noise.updated = false;
            }
            this.clockMain = 0;
        }
    }

    soundRegisters = new Uint8Array(65536).fill(0);

    write(addr: number, value: number) {
        let dutyCycle = 0;
        this.soundRegisters[addr] = value;
        switch (addr) {

            // Pulse 1
            case 0xFF10: // NR10
                this.pulse1.freqSweepTime = (value & 0b01110000) >> 4; // in 128ths of a second (0-7)
                this.pulse1.freqSweepUp = ((value >> 3) & 1) === 0; // 0 === Add, 1 = Sub
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
                this.pulse1.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
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
                this.pulse2.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
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
                this.wave.lengthCounter = value;
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
                this.wave.lengthEnable = ((value >> 6) & 1) === 0;
                writeDebug(this.wave.lengthEnable);
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
                this.noise.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
                this.noise.volumeEnvelopeSweep = value & 0b111;
                this.noise.update();
                break;
            case 0xFF22: // NR43
                this.noise.shiftClockFrequency = (value >> 4) & 0b111;
                this.noise.counterStep = ((value >> 3) & 1) != 0;
                this.noise.envelopeSweep = (value & 0b111);
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
                this.noise.outputRight = (((value >> 7) & 1) === 1);
                this.wave.outputRight = (((value >> 6) & 1) === 1);
                this.pulse2.outputRight = (((value >> 5) & 1) === 1);
                this.pulse1.outputRight = (((value >> 4) & 1) === 1);

                this.noise.outputLeft = (((value >> 3) & 1) === 1);
                this.wave.outputLeft = (((value >> 2) & 1) === 1);
                this.pulse2.outputLeft = (((value >> 1) & 1) === 1);
                this.pulse1.outputLeft = (((value >> 0) & 1) === 1);

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

        if (addr >= 0xFF27 && addr <= 0xFF2F) i = 0xFF;

        if (addr === 0xFF26) { // NR52
            i = 0;
            if (this.enabled) i |= (1 << 7);
            if (this.noise.enabled) i |= (1 << 3);
            if (this.wave.enabled) i |= (1 << 2);
            if (this.pulse2.enabled) i |= (1 << 1);
            if (this.pulse1.enabled) i |= (1 << 0);
        }

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
            case 0x26: i |= 0xFF; break;
        }

        return i;
    }

    reset() {
        this.enabled = false;

        this.pulse1 = new PulseChannel();
        this.pulse2 = new PulseChannel();
        this.wave = new WaveChannel();
        this.noise = new NoiseChannel();

        this.tjs.step();


        this.clockMain = 0;
        this.clockEnvelope1 = 0;
        this.clockEnvelope2 = 0;
    }
}