import { PulseChannel, WaveChannel, NoiseChannel } from "./channels";
import GameBoy from "../gameboy";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { AudioPlugin } from "./audioplugin";
import { HWIO } from "../memory/hwio";

export default class SoundChip implements HWIO {
    static lerp(v0: number, v1: number, t: number): number {
        return v0 * (1 - t) + v1 * t;
    }

    enabled = false;

    gb: GameBoy;
    ticksEnvelopePulse1 = 0;
    ticksEnvelopePulse2 = 0;
    ticksEnvelopeNoise = 0;

    clockPulse1FreqSweep = 0;

    clockFrameSequencer = 0;
    frameSequencerStep = 0;

    pulse1 = new PulseChannel();
    pulse2 = new PulseChannel();
    wave = new WaveChannel();
    noise = new NoiseChannel();

    ap: AudioPlugin | null = null;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }



    step(cycles: number) {
        // #region CLOCK
        if (this.enabled) {
            this.clockFrameSequencer += cycles;

            // 512Hz Frame Sequencer
            while (this.clockFrameSequencer >= 8192) {
                switch (this.frameSequencerStep) {
                    case 0:
                    case 4:
                        this.length();
                        this.tjsCheck();
                        break;
                    case 2:
                    case 6:
                        this.length();
                        this.frequencySweep();
                        this.tjsCheck();
                        break;
                    case 7:
                        this.volumeEnvelope();
                        this.tjsCheck();
                        break;
                    default:
                        break;
                }


                this.frameSequencerStep++; this.frameSequencerStep &= 0b111;
                this.clockFrameSequencer -= 8192;
            }
        } else {
            this.clockFrameSequencer = 0;
        }
    }

    frequencySweep() {
        // writeDebug("Frequency sweep")
        let actualTime = this.pulse1.freqSweepTime;
        if (actualTime == 0) actualTime = 8;
        if (this.clockPulse1FreqSweep > actualTime && this.pulse1.freqSweepShift !== 0) {
            this.clockPulse1FreqSweep = 0;

            let freq = (this.pulse1.frequencyUpper << 8) | this.pulse1.frequencyLower;
            const diff = freq >> this.pulse1.freqSweepShift;
            let newFreq = this.pulse1.freqSweepUp ? freq + diff : freq - diff;
            freq = newFreq;
            if (newFreq > 2047) {
                this.pulse1.enabled = false;
            }
            this.pulse1.frequencyLower = freq & 0xFF;
            this.pulse1.frequencyUpper = (freq >> 8) & 0xFF;
            this.pulse1.updated = true;
            // writeDebug("abs(Range): " + diff);
            // writeDebug("Resulting frequency: " + this.pulse1.frequencyHz);
        }
        this.clockPulse1FreqSweep++;
    }

    volumeEnvelope() {
        this.ticksEnvelopePulse1++;
        if (this.ticksEnvelopePulse1 >= this.pulse1.volumeEnvelopeSweep) {
            if (this.pulse1.volumeEnvelopeSweep !== 0) {
                if (this.pulse1.volumeEnvelopeUp) {
                    if (this.pulse1.volume < 15) {
                        this.pulse1.volume++;
                        this.pulse1.updated = true;
                    }
                } else {
                    if (this.pulse1.volume > 0) {
                        this.pulse1.volume--;
                        this.pulse1.updated = true;
                    }
                }
            }
            this.ticksEnvelopePulse1 = 0;
        }

        this.ticksEnvelopePulse2++;
        if (this.ticksEnvelopePulse2 >= this.pulse2.volumeEnvelopeSweep) {
            if (this.pulse2.volumeEnvelopeSweep !== 0) {
                if (this.pulse2.volumeEnvelopeUp) {
                    if (this.pulse2.volume < 15) {
                        this.pulse2.volume++;
                        this.pulse2.updated = true;
                    }
                } else {
                    if (this.pulse2.volume > 0) {
                        this.pulse2.volume--;
                        this.pulse2.updated = true;
                    }
                }
            }
            this.ticksEnvelopePulse2 = 0;
        }

        this.ticksEnvelopeNoise++;
        if (this.ticksEnvelopeNoise >= this.noise.volumeEnvelopeSweep) {
            if (this.noise.volumeEnvelopeSweep !== 0) {
                if (this.noise.volumeEnvelopeUp) {
                    if (this.noise.volume < 15) {
                        this.noise.volume++;
                        this.noise.updated = true;
                    }
                } else {
                    if (this.noise.volume > 0) {
                        this.noise.volume--;
                        this.noise.updated = true;
                    }
                }
            }
            this.ticksEnvelopeNoise = 0;
        }
    }

    length() {
        if (this.pulse1.lengthCounter > 0 && this.pulse1.lengthEnable) {
            this.pulse1.lengthCounter--;
            if (this.pulse1.lengthCounter === 0) {
                this.pulse1.enabled = false;
                this.pulse1.updated = true;
            }
        }

        if (this.pulse2.lengthCounter > 0 && this.pulse2.lengthEnable) {
            this.pulse2.lengthCounter--;
            if (this.pulse2.lengthCounter === 0) {
                this.pulse2.enabled = false;
                this.pulse2.updated = true;
            }
        }

        if (this.wave.lengthCounter > 0 && this.wave.lengthEnable) {
            this.wave.lengthCounter--;
            if (this.wave.lengthCounter === 0) {
                this.wave.enabled = false;
                this.wave.updated = true;
            }
        }

        if (this.noise.lengthCounter > 0 && this.noise.lengthEnable) {
            this.noise.lengthCounter--;
            if (this.noise.lengthCounter === 0) {
                this.noise.enabled = false;
                this.noise.updated = true;
            }
        }

        if (this.wave.waveTableUpdated === true) {
            if (this.ap !== null)
                this.ap.updateWaveTable(this);
            this.wave.waveTableUpdated = false;
        }
    }

    tjsCheck() {
        if (this.ap !== null) {
            if (this.pulse1.updated) {
                this.ap.pulse1(this);
                this.pulse1.updated = false;
            }
            if (this.pulse2.updated) {
                this.ap.pulse2(this);
                this.pulse2.updated = false;
            }
            if (this.wave.updated) {
                this.ap.wave(this);
                this.wave.updated = false;
            }
            if (this.noise.updated) {
                this.ap.noise(this);
                this.noise.updated = false;
            }
        }
    }

    soundRegisters = new Uint8Array(65536).fill(0);

    writeHwio(addr: number, value: number) {
        if (this.enabled) {
            this.soundRegisters[addr] = value;

            switch (addr) {
                // Pulse 1
                case 0xFF10: // NR10
                    this.pulse1.freqSweepTime = (value & 0b01110000) >> 4; // in 128ths of a second (0-7)
                    this.pulse1.freqSweepUp = ((value >> 3) & 1) === 0; // 0 === Add, 1 = Sub
                    this.pulse1.freqSweepShift = (value & 0b111); // 0-7; 
                    this.pulse1.updated = true;
                    break;
                case 0xFF11: // NR11
                    this.pulse1.width = value >> 6;
                    this.pulse1.lengthCounter = 64 - (value & 0b111111);
                    this.pulse1.updated = true;
                    break;
                case 0xFF12: // NR12
                    this.pulse1.volume = (value >> 4) & 0xF;
                    this.pulse1.volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.pulse1.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
                    this.pulse1.volumeEnvelopeSweep = value & 0b111;
                    this.pulse1.dacEnabled = (value & 0b11111000) != 0;
                    if (!this.pulse1.dacEnabled) this.pulse1.enabled = false;
                    this.pulse1.updated = true;
                    break;
                case 0xFF13: // NR13 Low bits
                    this.pulse1.oldFrequencyLower = this.pulse1.frequencyLower;
                    this.pulse1.frequencyLower = value;
                    this.pulse1.updated = true;
                    break;
                case 0xFF14: // NR14
                    this.pulse1.frequencyUpper = value & 0b111;
                    this.pulse1.lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) this.pulse1.trigger();
                    this.pulse1.updated = true;
                    break;

                // Pulse 2
                case 0xFF16: // NR21
                    this.pulse2.width = value >> 6;
                    this.pulse2.lengthCounter = 64 - (value & 0b111111);
                    this.pulse2.updated = true;
                    break;
                case 0xFF17: // NR22
                    this.pulse2.volume = (value >> 4) & 0xF;
                    this.pulse2.volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.pulse2.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
                    this.pulse2.volumeEnvelopeSweep = value & 0b111;
                    this.pulse2.dacEnabled = (value & 0b11111000) != 0;
                    if (!this.pulse2.dacEnabled) this.pulse2.enabled = false;
                    this.pulse2.updated = true;
                    break;
                case 0xFF18: // NR23
                    this.pulse2.oldFrequencyLower = this.pulse2.frequencyLower;
                    this.pulse2.frequencyLower = value;
                    this.pulse2.updated = true;
                    break;
                case 0xFF19: // NR24
                    this.pulse2.frequencyUpper = value & 0b111;
                    this.pulse2.lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) this.pulse2.trigger();
                    this.pulse2.updated = true;
                    break;

                // Wave
                case 0xFF1A: // NR30
                    this.wave.dacEnabled = (value & 0x80) !== 0;
                    if (!this.wave.dacEnabled) this.wave.enabled = false;
                    this.wave.updated = true;
                    break;
                case 0xFF1B: // NR31
                    this.wave.lengthCounter = 256 - value;
                    this.wave.updated = true;
                    break;
                case 0xFF1C: // NR32
                    this.wave.volume = (value >> 5) & 0b11;
                    this.wave.updated = true;
                    break;
                case 0xFF1D: // NR33
                    this.wave.frequencyLower = value;
                    this.wave.updated = true;
                    break;
                case 0xFF1E: // NR34
                    this.wave.frequencyUpper = value & 0b111;
                    if (((value >> 7) & 1) !== 0) this.wave.trigger();
                    this.wave.lengthEnable = ((value >> 6) & 1) !== 0;
                    this.wave.updated = true;
                    break;

                // Noise
                case 0xFF20: // NR41
                    this.noise.lengthCounter = 64 - (value & 0b111111); // 6 bits
                    this.noise.updated = true;
                    break;
                case 0xFF21: // NR42
                    this.noise.volume = (value >> 4) & 0xF;
                    this.noise.volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.noise.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
                    this.noise.volumeEnvelopeSweep = value & 0b111;
                    this.noise.dacEnabled = (value & 0b11111000) != 0;
                    if (!this.noise.dacEnabled) this.noise.enabled = false;
                    this.noise.updated = true;
                    break;
                case 0xFF22: // NR43
                    this.noise.shiftClockFrequency = (value >> 4) & 0xF;
                    this.noise.counterStep = ((value >> 3) & 1) !== 0;
                    this.noise.divisorCode = (value & 0b111);
                    this.noise.updated = true;
                    break;
                case 0xFF23: // NR44
                    if (((value >> 7) & 1) !== 0) this.noise.trigger();
                    this.noise.lengthEnable = ((value >> 6) & 1) !== 0;
                    this.noise.updated = true;
                    break;


                case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
                case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                    const BASE = 0xFF30;
                    if (this.wave.waveTable[((addr - BASE) * 2) + 0] != (value >> 4)) {
                        this.wave.waveTable[((addr - BASE) * 2) + 0] = value >> 4;
                        this.wave.waveTableUpdated = true;
                    }
                    if (this.wave.waveTable[((addr - BASE) * 2) + 1] != (value & 0xF)) {
                        this.wave.waveTable[((addr - BASE) * 2) + 1] = value & 0xF;
                        this.wave.waveTableUpdated = true;
                    }
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

                    this.pulse1.updated = true;
                    this.pulse2.updated = true;
                    this.wave.updated = true;
                    this.noise.updated = true;

                    break;
            }
        }
        if (addr === 0xFF26) {
            // Control
            if (((value >> 7) & 1) !== 0) {
                // writeDebug("Enabled sound");
                this.enabled = true;

            } else {
                // Disable and write zeros on everything upon main disabling
                this.noise.enabled = false;
                this.wave.enabled = false;
                this.pulse2.enabled = false;
                this.pulse1.enabled = false;

                this.noise.dacEnabled = false;
                this.wave.dacEnabled = false;
                this.pulse2.dacEnabled = false;
                this.pulse1.dacEnabled = false;

                this.writeHwio(0xFF10, 0);
                this.writeHwio(0xFF11, 0);
                this.writeHwio(0xFF12, 0);
                this.writeHwio(0xFF13, 0);
                this.writeHwio(0xFF14, 0);

                this.writeHwio(0xFF16, 0);
                this.writeHwio(0xFF17, 0);
                this.writeHwio(0xFF18, 0);
                this.writeHwio(0xFF19, 0);

                this.writeHwio(0xFF1A, 0);
                this.writeHwio(0xFF1B, 0);
                this.writeHwio(0xFF1C, 0);
                this.writeHwio(0xFF1D, 0);
                this.writeHwio(0xFF1D, 0);

                this.writeHwio(0xFF20, 0);
                this.writeHwio(0xFF21, 0);
                this.writeHwio(0xFF22, 0);
                this.writeHwio(0xFF23, 0);

                for (let i = 0xFF10; i <= 0xFF25; i++) {
                    this.soundRegisters[i] = 0;
                }
                this.enabled = false;
            }
        }
    }

    readHwio(addr: number): number | null {
        if (addr >= 0xFF10 && addr <= 0xFF3F) {
            let i = this.soundRegisters[addr];

            if (addr >= 0xFF27 && addr <= 0xFF2F) return 0xFF;

            if (addr === 0xFF26) { // NR52
                i = 0;
                if (this.enabled) i |= (1 << 7);
                i |= 0b01110000;
                if (this.noise.enabled && this.noise.dacEnabled) i |= (1 << 3);
                if (this.wave.enabled && this.wave.dacEnabled) i |= (1 << 2);
                if (this.pulse2.enabled && this.pulse2.dacEnabled) i |= (1 << 1);
                if (this.pulse1.enabled && this.pulse1.dacEnabled) i |= (1 << 0);
                return i;
            }

            switch (addr) {
                case 0xFF10: i |= 0x80; break;
                case 0xFF11: i |= 0x3F; break;
                case 0xFF12: i |= 0x00; break;
                case 0xFF13: i |= 0xFF; break;
                case 0xFF14: i |= 0xBF; break;

                case 0xFF15: i |= 0xFF; break;
                case 0xFF16: i |= 0x3F; break;
                case 0xFF17: i |= 0x00; break;
                case 0xFF18: i |= 0xFF; break;
                case 0xFF19: i |= 0xBF; break;

                case 0xFF1A: i |= 0x7F; break;
                case 0xFF1B: i |= 0xFF; break;
                case 0xFF1C: i |= 0x9F; break;
                case 0xFF1D: i |= 0xFF; break;
                case 0xFF1E: i |= 0xBF; break;

                case 0xFF1F: i |= 0xFF; break;
                case 0xFF20: i |= 0xFF; break;
                case 0xFF21: i |= 0x00; break;
                case 0xFF22: i |= 0x00; break;
                case 0xFF23: i |= 0xBF; break;

                case 0xFF24: i |= 0x00; break;
                case 0xFF25: i |= 0x00; break;
                case 0xFF26: i |= 0xFF; break;
            }

            return i;
        }

        return null;
    }

    reset() {
        this.enabled = false;

        this.pulse1 = new PulseChannel();
        this.pulse2 = new PulseChannel();
        this.wave = new WaveChannel();
        this.noise = new NoiseChannel();

        if (this.ap !== null) {
            this.ap.pulse1(this);
            this.ap.pulse2(this);
            this.ap.wave(this);
            this.ap.noise(this);
        }

        this.clockFrameSequencer = 0;
        this.ticksEnvelopePulse1 = 0;
        this.ticksEnvelopePulse2 = 0;
        this.ticksEnvelopeNoise = 0;

        this.clockPulse1FreqSweep = 0;

        if (this.ap !== null) {
            this.ap.reset();
        }
    }

    setMuted(muted: boolean) {
        if (this.ap !== null) {
            this.ap.setMuted(muted);
        }
    }
}