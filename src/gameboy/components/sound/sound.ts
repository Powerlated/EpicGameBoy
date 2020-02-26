import GameBoy from "../../gameboy";

import { PulseChannel, WaveChannel, NoiseChannel } from "./channels";
import Tone from "tone";
import ToneJsHandler from "./tonejshandler";

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

    pulseChannel1 = new PulseChannel();
    pulseChannel2 = new PulseChannel();
    waveChannel = new WaveChannel();
    noiseChannel = new NoiseChannel();

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
        const CLOCK_SWEEP_STEPS = 32768;

        this.clockMain += this.gb.cpu.lastInstructionCycles / 4;
        this.clockEnvelope1 += (this.gb.cpu.lastInstructionCycles / 4) / this.pulseChannel1.volumeEnvelopeSweep; // 16384 hz, divide as needed 
        this.clockEnvelope2 += (this.gb.cpu.lastInstructionCycles / 4) / this.pulseChannel2.volumeEnvelopeSweep; // 16384 hz, divide as needed
        this.clockEnvelopeNoise += (this.gb.cpu.lastInstructionCycles / 4) / this.noiseChannel.volumeEnvelopeSweep; // 16384 hz, divide as needed

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

        if (this.clockEnvelopeNoise >= CLOCK_ENVELOPE_STEPS) {
            if (this.noiseChannel.volumeEnvelopeSweep != 0) {
                if (this.noiseChannel.volume > 0 && this.noiseChannel.volume < 16) {
                    if (this.noiseChannel.volumeEnvelopeUp) {
                        this.noiseChannel.volume++;
                    } else {
                        this.noiseChannel.volume--;
                    }
                }
            }
            this.clockEnvelopeNoise = 0;
        }
        // #endregion

        // 1048576hz Divide by 4096 = 256hz
        if (this.clockMain >= CLOCK_MAIN_STEPS) {
            // #region TRIGGERS
            if (this.pulseChannel1.triggered) this.pulseChannel1.trigger();
            if (this.pulseChannel2.triggered) this.pulseChannel2.trigger();
            if (this.waveChannel.triggered) this.waveChannel.trigger();
            if (this.noiseChannel.triggered) this.noiseChannel.trigger();
            this.pulseChannel1.triggered = false;
            this.pulseChannel2.triggered = false;
            this.waveChannel.triggered = false;
            this.noiseChannel.triggered = false;
            // #endregion

            // #region LENGTH
            if (this.pulseChannel1.enabled) {
                if (this.pulseChannel1.lengthEnable) {
                    this.pulseChannel1.lengthCounter--;
                    if (this.pulseChannel1.lengthCounter == 0) {
                        this.pulseChannel1.enabled = false;
                    }
                }
            }

            if (this.pulseChannel2.enabled) {
                if (this.pulseChannel2.lengthEnable) {
                    this.pulseChannel2.lengthCounter--;
                    if (this.pulseChannel2.lengthCounter == 0) {
                        this.pulseChannel2.enabled = false;
                    }
                }
            }

            if (this.waveChannel.enabled) {
                if (this.waveChannel.lengthEnable) {
                    this.waveChannel.lengthCounter--;
                    if (this.waveChannel.lengthCounter == 0) {
                        this.waveChannel.enabled = false;
                    }
                }
            }

            if (this.noiseChannel.enabled) {
                if (this.noiseChannel.lengthEnable) {
                    this.noiseChannel.lengthCounter--;
                    if (this.noiseChannel.lengthCounter == 0) {
                        this.noiseChannel.enabled = false;
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

    soundRegisters = new Array(65536).fill(0);

    write(addr: number, value: number) {
        let dutyCycle = 0;
        this.soundRegisters[addr] = value;
        switch (addr) {

            // Pulse 1
            case 0xFF10: // NR10
                this.pulseChannel1.update();
                break;
            case 0xFF11: // NR11
                this.pulseChannel1.width = (value & 0b11000000) >> 6;
                this.pulseChannel1.lengthCounter = 64 - (value & 0b111111);
                this.pulseChannel1.update();
                break;
            case 0xFF12: // NR12
                this.pulseChannel1.volume = (value >> 4) & 0xF;
                this.pulseChannel1.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.pulseChannel1.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.pulseChannel1.volumeEnvelopeSweep = value & 0b111;
                this.pulseChannel1.update();
                break;
            case 0xFF13: // NR13 Low bits
                this.pulseChannel1.oldFrequencyLower = this.pulseChannel1.frequencyLower;
                this.pulseChannel1.frequencyLower = value;
                this.pulseChannel1.update();
                break;
            case 0xFF14: // NR14
                this.pulseChannel1.frequencyUpper = value & 0b111;
                this.pulseChannel1.lengthEnable = ((value >> 6) & 1) != 0;
                this.pulseChannel1.triggered = ((value >> 7) & 1) != 0;
                this.pulseChannel1.update();
                break;

            // Pulse 2
            case 0xFF16: // NR21
                this.pulseChannel2.width = (value & 0b11000000) >> 6;
                this.pulseChannel2.lengthCounter = 64 - (value & 0b111111);
                this.pulseChannel2.update();
                break;
            case 0xFF17: // NR22
                this.pulseChannel2.volume = (value >> 4) & 0xF;
                this.pulseChannel2.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.pulseChannel2.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.pulseChannel2.volumeEnvelopeSweep = value & 0b111;
                this.pulseChannel2.update();
                break;
            case 0xFF18: // NR23
                this.pulseChannel2.oldFrequencyLower = this.pulseChannel2.frequencyLower;
                this.pulseChannel2.frequencyLower = value;
                this.pulseChannel2.update();
                break;
            case 0xFF19: // NR24
                this.pulseChannel2.frequencyUpper = value & 0b111;
                this.pulseChannel2.lengthEnable = ((value >> 6) & 1) != 0;
                this.pulseChannel2.triggered = ((value >> 7) & 1) != 0;
                this.pulseChannel2.update();
                break;

            // Wave
            case 0xFF1A: // NR30
                this.waveChannel.update();
                break;
            case 0xFF1B: // NR31
                this.waveChannel.lengthCounter = 256 - value;
                this.waveChannel.update();
                break;
            case 0xFF1C: // NR32
                this.waveChannel.volume = (value >> 5) & 0b11;
                this.waveChannel.update();
                break;
            case 0xFF1D: // NR33
                this.waveChannel.frequencyLower = value;
                this.waveChannel.waveTableUpdated = true;
                this.waveChannel.update();
                break;
            case 0xFF1E: // NR34
                this.waveChannel.frequencyUpper = value & 0b111;
                this.waveChannel.triggered = ((value >> 7) & 1) != 0;
                this.waveChannel.lengthEnable = ((value >> 6) & 1) == 1;
                this.waveChannel.waveTableUpdated = true;
                this.waveChannel.update();
                break;

            // Noise
            case 0xFF20: // NR41
                this.noiseChannel.lengthCounter = 64 - (value & 0b111111); // 6 bits
                this.noiseChannel.update();
                break;
            case 0xFF21: // NR42
                this.noiseChannel.volume = (value >> 4) & 0xF;
                this.noiseChannel.volumeEnvelopeStart = (value >> 4) & 0xF;
                this.noiseChannel.volumeEnvelopeUp = ((value >> 3) & 1) == 1;
                this.noiseChannel.volumeEnvelopeSweep = value & 0b111;
                this.noiseChannel.update();
                break;
            case 0xFF22: // NR43
                this.noiseChannel.update();
                break;
            case 0xFF23: // NR44
                this.noiseChannel.triggered = ((value >> 7) & 1) != 0;
                this.noiseChannel.lengthEnable = ((value >> 6) & 1) != 0;
                this.noiseChannel.update();
                break;


            case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
            case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                const BASE = 0xFF30;
                this.waveChannel.waveTable[((addr - BASE) * 2) + 0] = value >> 4;
                this.waveChannel.waveTable[((addr - BASE) * 2) + 1] = value & 0xF;
                this.waveChannel.waveTableUpdated = true;
                this.waveChannel.update();
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
            case 0xFF26: // NR52
                if (((value >> 7) & 1) != 0) {
                    this.enabled = true;
                    console.log("Enabled sound");
                } else {
                    console.log("Disabled sound");
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
            if (this.noiseChannel) i |= (1 << 3);
            if (this.waveChannel) i |= (1 << 2);
            if (this.pulseChannel2) i |= (1 << 1);
            if (this.pulseChannel1) i |= (1 << 0);
        }

        return i;
    }

    reset() {
        this.enabled = false;

        this.pulseChannel1 = new PulseChannel();
        this.pulseChannel2 = new PulseChannel();
        this.waveChannel = new WaveChannel();
        this.noiseChannel = new NoiseChannel();

        this.clockMain = 0;
        this.clockEnvelope1 = 0;
        this.clockEnvelope2 = 0;
    }

    setMuted(muted: boolean) {
        this.enabled = !muted;
        this.tjs.pulseOsc1.mute = muted;
        this.tjs.pulseOsc2.mute = muted;
        this.tjs.waveVolume.mute = muted;
    }
}