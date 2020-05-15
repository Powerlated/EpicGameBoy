import { PulseChannel, WaveChannel, NoiseChannel } from "./channels";
import GameBoy from "../gameboy";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { AudioPlugin } from "./audioplugin";
import { HWIO } from "../memory/hwio";
import { BIT_7, BIT_3, BIT_2, BIT_1, BIT_0 } from "../bit_constants";
import { Serializer, PUT_BOOL, PUT_32LE, PUT_16LE, PUT_8, PUT_8ARRAY, GET_BOOL, GET_16LE, GET_8, GET_8ARRAY } from "../serialize";

export default class SoundChip implements HWIO {
    constructor(gb: GameBoy) {
        this.gb = gb;
    }
    gb: GameBoy;

    enabled = false;

    ticksEnvelopePulse1 = 0;
    ticksEnvelopePulse2 = 0;
    ticksEnvelopeNoise = 0;

    clockPulse1FreqSweep = 0;
    freqSweepEnabled = false;

    frameSequencerStep = 0;

    pulse1 = new PulseChannel();
    pulse2 = new PulseChannel();
    wave = new WaveChannel();
    noise = new NoiseChannel();

    ap: AudioPlugin | null = null;

    soundRegisters = new Uint8Array(65536).fill(0);

    advanceFrameSequencer() {
        // 512Hz Frame Sequencer
        switch (this.frameSequencerStep) {
            case 0:
            case 4:
                this.length();
                this.apCheck();
                break;
            case 2:
            case 6:
                this.length();
                this.frequencySweep();
                this.apCheck();
                break;
            case 7:
                this.volumeEnvelope();
                this.apCheck();
                break;
            default:
                break;
        }

        this.frameSequencerStep++; this.frameSequencerStep &= 0b111;
    }


    private frequencySweep() {
        // writeDebug("Frequency sweep")
        let actualPeriod = this.pulse1.freqSweepPeriod;
        if (actualPeriod == 0) actualPeriod = 8;
        if (this.clockPulse1FreqSweep > actualPeriod) {
            this.clockPulse1FreqSweep = 0;
            if (this.freqSweepEnabled === true) {
                this.applyFrequencySweep();
            }

            // writeDebug("abs(Range): " + diff);
            // writeDebug("Resulting frequency: " + this.pulse1.frequencyHz);

        }

        this.clockPulse1FreqSweep++;

    }

    private applyFrequencySweep() {
        let freq = (this.pulse1.frequencyUpper << 8) | this.pulse1.frequencyLower;
        const diff = freq >> this.pulse1.freqSweepShift;
        const newFreq = this.pulse1.freqSweepUp ? freq + diff : freq - diff;
        freq = newFreq;
        if (newFreq > 2047) {
            this.pulse1.enabled = false;
        }
        if (this.pulse1.freqSweepPeriod !== 0 && this.pulse1.freqSweepShift !== 0) {

            this.pulse1.frequencyLower = freq & 0xFF;
            this.pulse1.frequencyUpper = (freq >> 8) & 0xFF;
        }
        this.pulse1.updated = true;

        this.apCheck();
    }

    private volumeEnvelope() {
        this.ticksEnvelopePulse1++;
        if (this.ticksEnvelopePulse1 >= this.pulse1.volumeEnvelopeSweep) {
            if (this.pulse1.volumeEnvelopeSweep !== 0) {
                if (this.pulse1.volumeEnvelopeUp === true) {
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
                if (this.pulse2.volumeEnvelopeUp === true) {
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
                if (this.noise.volumeEnvelopeUp === true) {
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

    private length() {
        if (this.pulse1.lengthEnable === true && this.pulse1.lengthCounter > 0) {
            this.pulse1.lengthCounter--;
            if (this.pulse1.lengthCounter === 0) {
                this.pulse1.enabled = false;
                this.pulse1.updated = true;
            }
        }

        if (this.pulse2.lengthEnable === true && this.pulse2.lengthCounter > 0) {
            this.pulse2.lengthCounter--;
            if (this.pulse2.lengthCounter === 0) {
                this.pulse2.enabled = false;
                this.pulse2.updated = true;
            }
        }

        if (this.wave.lengthEnable === true && this.wave.lengthCounter > 0) {
            this.wave.lengthCounter--;
            if (this.wave.lengthCounter === 0) {
                this.wave.enabled = false;
                this.wave.updated = true;
            }
        }

        if (this.noise.lengthEnable === true && this.noise.lengthCounter > 0) {
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

    private apCheck() {
        if (this.ap !== null) {
            if (this.pulse1.updated === true) {
                this.ap.pulse1(this);
                this.pulse1.updated = false;
            }
            if (this.pulse2.updated === true) {
                this.ap.pulse2(this);
                this.pulse2.updated = false;
            }
            if (this.wave.updated === true) {
                this.ap.wave(this);
                this.wave.updated = false;
            }
            if (this.noise.updated === true) {
                this.ap.noise(this);
                this.noise.updated = false;
            }
        }
    }

    writeHwio(addr: number, value: number) {
        if (this.enabled) {
            this.soundRegisters[addr] = value;

            switch (addr) {
                // Pulse 1
                case 0xFF10: // NR10
                    this.pulse1.freqSweepPeriod = (value & 0b01110000) >> 4; // in 128ths of a second (0-7)
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
                    this.pulse1.dacEnabled = (value & 0b11111000) !== 0;
                    if (!this.pulse1.dacEnabled) this.pulse1.enabled = false;
                    this.pulse1.updated = true;
                    break;
                case 0xFF13: // NR13 Low bits
                    this.pulse1.frequencyLower = value;
                    this.pulse1.updated = true;
                    break;
                case 0xFF14: // NR14
                    this.pulse1.frequencyUpper = value & 0b111;
                    this.pulse1.lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) {
                        this.pulse1.trigger();

                        this.freqSweepEnabled = this.pulse1.freqSweepShift !== 0 || this.pulse1.freqSweepPeriod !== 0;

                        // if (this.pulse1.freqSweepShift > 0) {
                        //     this.applyFrequencySweep();
                        // }
                    }
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
                    this.pulse2.dacEnabled = (value & 0b11111000) !== 0;
                    if (!this.pulse2.dacEnabled) this.pulse2.enabled = false;
                    this.pulse2.updated = true;
                    break;
                case 0xFF18: // NR23
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

    readHwio(addr: number): number {
        if (addr >= 0xFF10 && addr <= 0xFF3F) {
            let i = this.soundRegisters[addr];

            if (addr >= 0xFF27 && addr <= 0xFF2F) return 0xFF;

            if (addr >= 0xFF30 && addr <= 0xFF3F && this.wave.dacEnabled) return 0xFF;

            if (addr === 0xFF26) { // NR52
                i = 0;
                if (this.enabled) i |= BIT_7;
                i |= 0b01110000;
                if (this.noise.enabled && this.noise.dacEnabled) i |= BIT_3;
                if (this.wave.enabled && this.wave.dacEnabled) i |= BIT_2;
                if (this.pulse2.enabled && this.pulse2.dacEnabled) i |= BIT_1;
                if (this.pulse1.enabled && this.pulse1.dacEnabled) i |= BIT_0;
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

        return 0xFF;
    }

    reset() {
        this.enabled = false;

        this.ticksEnvelopePulse1 = 0;
        this.ticksEnvelopePulse2 = 0;
        this.ticksEnvelopeNoise = 0;

        this.clockPulse1FreqSweep = 0;
        this.freqSweepEnabled = false;

        this.frameSequencerStep = 0;

        this.pulse1 = new PulseChannel();
        this.pulse2 = new PulseChannel();
        this.wave = new WaveChannel();
        this.noise = new NoiseChannel();

        this.soundRegisters = new Uint8Array(65536).fill(0);

        if (this.ap !== null) {
            this.ap.pulse1(this);
            this.ap.pulse2(this);
            this.ap.wave(this);
            this.ap.noise(this);
        }

        if (this.ap !== null) {
            this.ap.reset();
        }
    }

    private muted = false;

    getMuted(): boolean {
        return this.muted;
    }

    setMuted(muted: boolean) {
        if (this.ap !== null) {
            this.ap.setMuted(muted);
        }
        this.muted = muted;
    }

    serialize(state: Serializer) {
        PUT_BOOL(state, this.enabled);

        PUT_16LE(state, this.ticksEnvelopePulse1);
        PUT_16LE(state, this.ticksEnvelopePulse2);
        PUT_16LE(state, this.ticksEnvelopeNoise);

        PUT_16LE(state, this.clockPulse1FreqSweep);
        PUT_BOOL(state, this.freqSweepEnabled);

        PUT_8(state, this.frameSequencerStep);

        PUT_BOOL(state, this.pulse1.enabled);
        PUT_8(state, this.pulse1.width);
        PUT_BOOL(state, this.pulse1.dacEnabled);
        PUT_BOOL(state, this.pulse1.lengthEnable);
        PUT_8(state, this.pulse1.lengthCounter);
        PUT_8(state, this.pulse1.frequencyUpper);
        PUT_8(state, this.pulse1.frequencyLower);
        PUT_8(state, this.pulse1.volume);
        PUT_BOOL(state, this.pulse1.volumeEnvelopeUp);
        PUT_8(state, this.pulse1.volumeEnvelopeSweep);
        PUT_8(state, this.pulse1.volumeEnvelopeStart);
        PUT_8(state, this.pulse1.oldVolume);
        PUT_BOOL(state, this.pulse1.outputLeft);
        PUT_BOOL(state, this.pulse1.outputRight);
        PUT_8(state, this.pulse1.freqSweepPeriod);
        PUT_BOOL(state, this.pulse1.freqSweepUp);
        PUT_8(state, this.pulse1.freqSweepShift);
        PUT_BOOL(state, this.pulse1.updated);

        PUT_BOOL(state, this.pulse2.enabled);
        PUT_8(state, this.pulse2.width);
        PUT_BOOL(state, this.pulse2.dacEnabled);
        PUT_BOOL(state, this.pulse2.lengthEnable);
        PUT_8(state, this.pulse2.lengthCounter);
        PUT_8(state, this.pulse2.frequencyUpper);
        PUT_8(state, this.pulse2.frequencyLower);
        PUT_8(state, this.pulse2.volume);
        PUT_BOOL(state, this.pulse2.volumeEnvelopeUp);
        PUT_8(state, this.pulse2.volumeEnvelopeSweep);
        PUT_8(state, this.pulse2.volumeEnvelopeStart);
        PUT_8(state, this.pulse2.oldVolume);
        PUT_BOOL(state, this.pulse2.outputLeft);
        PUT_BOOL(state, this.pulse2.outputRight);
        PUT_8(state, this.pulse2.freqSweepPeriod);
        PUT_BOOL(state, this.pulse2.freqSweepUp);
        PUT_8(state, this.pulse2.freqSweepShift);
        PUT_BOOL(state, this.pulse2.updated);

        PUT_BOOL(state, this.wave.enabled);
        PUT_BOOL(state, this.wave.dacEnabled);
        PUT_BOOL(state, this.wave.lengthEnable);
        PUT_8(state, this.wave.lengthCounter);
        PUT_8(state, this.wave.frequencyUpper);
        PUT_8(state, this.wave.frequencyLower);
        PUT_8(state, this.wave.volume);
        PUT_8(state, this.wave.oldVolume);
        PUT_8ARRAY(state, this.wave.waveTable, 32);
        PUT_BOOL(state, this.wave.waveTableUpdated);
        PUT_BOOL(state, this.wave.outputLeft);
        PUT_BOOL(state, this.wave.outputRight);
        PUT_BOOL(state, this.wave.updated);

        PUT_BOOL(state, this.noise.enabled);
        PUT_8(state, this.noise.divisorCode);
        PUT_BOOL(state, this.noise.lengthEnable);
        PUT_8(state, this.noise.lengthCounter);
        PUT_BOOL(state, this.noise.dacEnabled);
        PUT_8(state, this.noise.volume);
        PUT_BOOL(state, this.noise.volumeEnvelopeUp);
        PUT_8(state, this.noise.volumeEnvelopeSweep);
        PUT_8(state, this.noise.volumeEnvelopeStart);
        PUT_BOOL(state, this.noise.outputLeft);
        PUT_BOOL(state, this.noise.outputRight);
        PUT_8(state, this.noise.shiftClockFrequency);
        PUT_BOOL(state, this.noise.counterStep);
        PUT_8(state, this.noise.envelopeSweep);
        PUT_BOOL(state, this.noise.updated);

        PUT_8ARRAY(state, this.soundRegisters, 65536);

    }

    deserialize(state: Serializer) {
        this.enabled = GET_BOOL(state);

        this.ticksEnvelopePulse1 = GET_16LE(state);
        this.ticksEnvelopePulse2 = GET_16LE(state);
        this.ticksEnvelopeNoise = GET_16LE(state);

        this.clockPulse1FreqSweep = GET_16LE(state);
        this.freqSweepEnabled = GET_BOOL(state);

        this.frameSequencerStep = GET_8(state);

        this.pulse1.enabled = GET_BOOL(state);
        this.pulse1.width = GET_8(state);
        this.pulse1.dacEnabled = GET_BOOL(state);
        this.pulse1.lengthEnable = GET_BOOL(state);
        this.pulse1.lengthCounter = GET_8(state);
        this.pulse1.frequencyUpper = GET_8(state);
        this.pulse1.frequencyLower = GET_8(state);
        this.pulse1.volume = GET_8(state);
        this.pulse1.volumeEnvelopeUp = GET_BOOL(state);
        this.pulse1.volumeEnvelopeSweep = GET_8(state);
        this.pulse1.volumeEnvelopeStart = GET_8(state);
        this.pulse1.oldVolume = GET_8(state);
        this.pulse1.outputLeft = GET_BOOL(state);
        this.pulse1.outputRight = GET_BOOL(state);
        this.pulse1.freqSweepPeriod = GET_8(state);
        this.pulse1.freqSweepUp = GET_BOOL(state);
        this.pulse1.freqSweepShift = GET_8(state);
        this.pulse1.updated = GET_BOOL(state);

        this.pulse2.enabled = GET_BOOL(state);
        this.pulse2.width = GET_8(state);
        this.pulse2.dacEnabled = GET_BOOL(state);
        this.pulse2.lengthEnable = GET_BOOL(state);
        this.pulse2.lengthCounter = GET_8(state);
        this.pulse2.frequencyUpper = GET_8(state);
        this.pulse2.frequencyLower = GET_8(state);
        this.pulse2.volume = GET_8(state);
        this.pulse2.volumeEnvelopeUp = GET_BOOL(state);
        this.pulse2.volumeEnvelopeSweep = GET_8(state);
        this.pulse2.volumeEnvelopeStart = GET_8(state);
        this.pulse2.oldVolume = GET_8(state);
        this.pulse2.outputLeft = GET_BOOL(state);
        this.pulse2.outputRight = GET_BOOL(state);
        this.pulse2.freqSweepPeriod = GET_8(state);
        this.pulse2.freqSweepUp = GET_BOOL(state);
        this.pulse2.freqSweepShift = GET_8(state);
        this.pulse2.updated = GET_BOOL(state);

        this.wave.enabled = GET_BOOL(state);
        this.wave.dacEnabled = GET_BOOL(state);
        this.wave.lengthEnable = GET_BOOL(state);
        this.wave.lengthCounter = GET_8(state);
        this.wave.frequencyUpper = GET_8(state);
        this.wave.frequencyLower = GET_8(state);
        this.wave.volume = GET_8(state);
        this.wave.oldVolume = GET_8(state);
        this.wave.waveTable = GET_8ARRAY(state, 32);
        this.wave.waveTableUpdated = GET_BOOL(state);
        this.wave.outputLeft = GET_BOOL(state);
        this.wave.outputRight = GET_BOOL(state);
        this.wave.updated = GET_BOOL(state);

        this.noise.enabled = GET_BOOL(state);
        this.noise.divisorCode = GET_8(state);
        this.noise.lengthEnable = GET_BOOL(state);
        this.noise.lengthCounter = GET_8(state);
        this.noise.dacEnabled = GET_BOOL(state);
        this.noise.volume = GET_8(state);
        this.noise.volumeEnvelopeUp = GET_BOOL(state);
        this.noise.volumeEnvelopeSweep = GET_8(state);
        this.noise.volumeEnvelopeStart = GET_8(state);
        this.noise.outputLeft = GET_BOOL(state);
        this.noise.outputRight = GET_BOOL(state);
        this.noise.shiftClockFrequency = GET_8(state);
        this.noise.counterStep = GET_BOOL(state);
        this.noise.envelopeSweep = GET_8(state);
        this.noise.updated = GET_BOOL(state);

        this.soundRegisters = GET_8ARRAY(state, 65536);
    }
}