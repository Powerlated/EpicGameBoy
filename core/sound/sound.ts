import { PulseChannel, WaveChannel, NoiseChannel } from "./channels";
import GameBoy from "../gameboy";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { AudioPlugin } from "./audioplugin";
import { HWIO } from "../memory/hwio";
import { BIT_7, BIT_3, BIT_2, BIT_1, BIT_0 } from "../bit_constants";
import { Serializer } from "../serialize";
import { SoundPlayer, SAMPLE_RATE } from "./soundplayer";

// const PULSE_DUTY = [
//     Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 1),
//     Uint8Array.of(1, 0, 0, 0, 0, 0, 0, 1),
//     Uint8Array.of(1, 0, 0, 0, 0, 1, 1, 1),
//     Uint8Array.of(0, 1, 1, 1, 1, 1, 1, 0),
// ];

const PULSE_DUTY = [
    Uint8Array.of(1, 1, 1, 1, 1, 1, 1, 0),
    Uint8Array.of(0, 1, 1, 1, 1, 1, 1, 0),
    Uint8Array.of(0, 1, 1, 1, 1, 0, 0, 0),
    Uint8Array.of(1, 0, 0, 0, 0, 0, 0, 1),
];

const CAPACITOR_FACTOR = 0.999958 ** (4194304 / SAMPLE_RATE); // DMG
// const CAPACITOR_FACTOR = 0.998943 ** (4194304 / SAMPLE_RATE); // CGB / MGB

const DAC_TABLE = new Float32Array(16);
for (let i = 0; i < 16; i++) {
    DAC_TABLE[i] = ((i / 15) * 2) - 1;
}

function generateNoiseBuffer(sevenBit: boolean): Uint8Array {
    let seed = 0xFF;

    function lfsr(putBitBack: boolean) {
        let bit = (seed) ^ (seed >> 1);
        bit &= 1;

        seed = (seed >> 1) | (bit << 14);

        if (putBitBack == true) {
            seed &= ~BIT_7;
            seed |= (bit << 6);
        }

        return (seed & 1) ^ 1;
    }


    let waveTable = new Uint8Array(32768).fill(0);
    seed = 0xFF;
    waveTable = waveTable.map((v, i) => {
        return lfsr(sevenBit);
    });
    return waveTable;
}

const SEVEN_BIT_NOISE = generateNoiseBuffer(true);
const FIFTEEN_BIT_NOISE = generateNoiseBuffer(false);

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

    soundRegisters = new Uint8Array(64).fill(0);

    advanceFrameSequencer() {
        // 512Hz Frame Sequencer
        switch (this.frameSequencerStep) {
            case 0:
            case 4:
                this.frameSequencerLength();
                break;
            case 2:
            case 6:
                this.frameSequencerLength();
                this.frameSequencerFrequencySweep();
                break;
            case 7:
                this.frameSequencerVolumeEnvelope();
                break;
            default:
                break;
        }

        this.frameSequencerStep++; this.frameSequencerStep &= 0b111;
    }

    pulse1FreqTimer = 0;
    pulse2FreqTimer = 0;
    waveFreqTimer = 0;
    noiseFreqTimer = 0;

    pulse1Pos = 0;
    pulse2Pos = 0;
    wavePos = 0;
    noisePos = 0;

    sampleTimer = 0;
    audioQueueLeft = new Float32Array(16384);
    audioQueueRight = new Float32Array(16384);
    audioQueueAt = 0;

    pulse1Period = 0;
    pulse2Period = 0;
    wavePeriod = 0;
    noisePeriod = 0;

    capacitor1 = 0;
    capacitor2 = 0;

    calcPulse1Period() { this.pulse1Period = (2048 - ((this.pulse1.frequencyUpper << 8) | this.pulse1.frequencyLower)) * 4; }
    calcPulse2Period() { this.pulse2Period = (2048 - ((this.pulse2.frequencyUpper << 8) | this.pulse2.frequencyLower)) * 4; }
    calcWavePeriod() { this.wavePeriod = (2048 - ((this.wave.frequencyUpper << 8) | this.wave.frequencyLower)) * 2; }
    calcNoisePeriod() { this.noisePeriod = ([8, 16, 32, 48, 64, 80, 96, 112][this.noise.divisorCode] << this.noise.shiftClockFrequency); }

    reloadPulse1Period() { this.pulse1FreqTimer = this.pulse1Period; }
    reloadPulse2Period() { this.pulse2FreqTimer = this.pulse2Period; }
    reloadWavePeriod() { this.waveFreqTimer = this.wavePeriod; }
    reloadNoisePeriod() { this.noiseFreqTimer = this.noisePeriod; }

    tick(cycles: number) {
        this.pulse1FreqTimer -= cycles;
        this.pulse2FreqTimer -= cycles;
        this.waveFreqTimer -= cycles;
        this.noiseFreqTimer -= cycles;

        if (this.pulse1FreqTimer <= 0) {
            this.pulse1FreqTimer += this.pulse1Period;

            this.pulse1Pos++;
            this.pulse1Pos &= 7;
        }

        if (this.pulse2FreqTimer <= 0) {
            this.pulse2FreqTimer += this.pulse2Period;

            this.pulse2Pos++;
            this.pulse2Pos &= 7;
        }

        if (this.waveFreqTimer <= 0) {
            this.waveFreqTimer += this.wavePeriod;

            this.wavePos++;
            this.wavePos &= 31;
        }

        if (this.noiseFreqTimer <= 0) {
            this.noiseFreqTimer += this.noisePeriod;

            this.noisePos++;
            this.noisePos &= 32767;
        }

        if (!this.gb.turbo) {
            this.sampleTimer += cycles;
            // Sample at 65536 Hz
            if (this.sampleTimer >= (4194304 / SAMPLE_RATE)) {
                this.sampleTimer -= (4194304 / SAMPLE_RATE);

                let in1 = 0;
                let in2 = 0;

                // Note: -1 value when disabled is the DAC DC offset

                if (this.pulse1.dacEnabled) {
                    let pulse1 = PULSE_DUTY[this.pulse1.width][this.pulse1Pos];
                    pulse1 = this.pulse1.enabled ? DAC_TABLE[pulse1 * this.pulse1.volume] : -1;

                    if (this.pulse1.outputLeft) in1 += pulse1;
                    if (this.pulse1.outputRight) in2 += pulse1;
                }

                if (this.pulse2.dacEnabled) {
                    let pulse2 = PULSE_DUTY[this.pulse2.width][this.pulse2Pos];
                    pulse2 = this.pulse2.enabled ? DAC_TABLE[pulse2 * this.pulse2.volume] : -1;
                    if (this.pulse2.outputLeft) in1 += pulse2;
                    if (this.pulse2.outputRight) in2 += pulse2;
                }

                if (this.wave.dacEnabled) {
                    let wave = this.wave.waveTable[this.wavePos];

                    wave >>= [4, 0, 1, 2][this.wave.volume];
                    wave = this.wave.enabled ? DAC_TABLE[wave] : -1;

                    if (this.wave.outputLeft) in1 += wave;
                    if (this.wave.outputRight) in2 += wave;
                }

                if (this.noise.dacEnabled) {
                    let noise = this.noise.counterStep ? SEVEN_BIT_NOISE[this.noisePos] : FIFTEEN_BIT_NOISE[this.noisePos];
                    noise = this.noise.enabled ? DAC_TABLE[noise * this.noise.volume] : -1;

                    if (this.noise.outputLeft) in1 += noise;
                    if (this.noise.outputRight) in2 += noise;
                }

                let out1 = in1 - this.capacitor1;
                let out2 = in2 - this.capacitor2;

                this.audioQueueLeft[this.audioQueueAt] = (out1 / 4);
                this.audioQueueRight[this.audioQueueAt] = (out2 / 4);

                this.capacitor1 = in1 - out1 * CAPACITOR_FACTOR;
                this.capacitor2 = in2 - out2 * CAPACITOR_FACTOR;

                this.audioQueueAt++;

                if (this.audioQueueAt >= 16384) {
                    this.soundPlayer.queueAudio(
                        this.audioQueueLeft,
                        this.audioQueueRight,
                        (this.gb.slomo ? SAMPLE_RATE / 2 : SAMPLE_RATE)
                    );
                    this.audioQueueAt = 0;
                }
            }
        }
    }

    soundPlayer = new SoundPlayer();

    resetPlayer() {
        this.soundPlayer.reset();
    }

    private frameSequencerFrequencySweep() {
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

        this.calcPulse1Period();
    }

    private frameSequencerVolumeEnvelope() {
        this.ticksEnvelopePulse1--;
        if (this.ticksEnvelopePulse1 <= 0) {
            if (this.pulse1.volumeEnvelopeSweep !== 0) {
                if (this.pulse1.volumeEnvelopeUp === true) {
                    if (this.pulse1.volume < 15) {
                        this.pulse1.volume++;
                    }
                } else {
                    if (this.pulse1.volume > 0) {
                        this.pulse1.volume--;
                    }
                }
            }
            this.ticksEnvelopePulse1 = this.pulse1.volumeEnvelopeSweep;
        }

        this.ticksEnvelopePulse2--;
        if (this.ticksEnvelopePulse2 <= 0) {
            if (this.pulse2.volumeEnvelopeSweep !== 0) {
                if (this.pulse2.volumeEnvelopeUp === true) {
                    if (this.pulse2.volume < 15) {
                        this.pulse2.volume++;
                    }
                } else {
                    if (this.pulse2.volume > 0) {
                        this.pulse2.volume--;
                    }
                }
            }
            this.ticksEnvelopePulse2 = this.pulse2.volumeEnvelopeSweep;
        }

        this.ticksEnvelopeNoise--;
        if (this.ticksEnvelopeNoise <= 0) {
            if (this.noise.volumeEnvelopeSweep !== 0) {
                if (this.noise.volumeEnvelopeUp === true) {
                    if (this.noise.volume < 15) {
                        this.noise.volume++;
                    }
                } else {
                    if (this.noise.volume > 0) {
                        this.noise.volume--;
                    }
                }
            }
            this.ticksEnvelopeNoise = this.noise.volumeEnvelopeSweep;
        }
    }

    private frameSequencerLength() {
        if (this.pulse1.lengthEnable === true && this.pulse1.lengthCounter > 0) {
            this.pulse1.lengthCounter--;
            if (this.pulse1.lengthCounter === 0) {
                this.pulse1.enabled = false;
            }
        }

        if (this.pulse2.lengthEnable === true && this.pulse2.lengthCounter > 0) {
            this.pulse2.lengthCounter--;
            if (this.pulse2.lengthCounter === 0) {
                this.pulse2.enabled = false;
            }
        }

        if (this.wave.lengthEnable === true && this.wave.lengthCounter > 0) {
            this.wave.lengthCounter--;
            if (this.wave.lengthCounter === 0) {
                this.wave.enabled = false;
            }
        }

        if (this.noise.lengthEnable === true && this.noise.lengthCounter > 0) {
            this.noise.lengthCounter--;
            if (this.noise.lengthCounter === 0) {
                this.noise.enabled = false;
            }
        }

        if (this.wave.waveTableUpdated === true) {
            if (this.ap !== null)
                this.ap.updateWaveTable(this);
            this.wave.waveTableUpdated = false;
        }
    }

    writeHwio(addr: number, value: number) {
        if (this.enabled) {
            this.soundRegisters[addr - 0xFF10] = value;

            switch (addr) {
                // Pulse 1
                case 0xFF10: // NR10
                    this.pulse1.freqSweepPeriod = (value & 0b01110000) >> 4; // in 128ths of a second (0-7)
                    this.pulse1.freqSweepUp = ((value >> 3) & 1) === 0; // 0 === Add, 1 = Sub
                    this.pulse1.freqSweepShift = (value & 0b111); // 0-7; 
                    break;
                case 0xFF11: // NR11
                    this.pulse1.width = value >> 6;
                    this.pulse1.lengthCounter = 64 - (value & 0b111111);
                    break;
                case 0xFF12: // NR12
                    const newUp = ((value >> 3) & 1) === 1;

                    if (this.pulse1.enabled) {
                        if (this.pulse1.volumeEnvelopeSweep === 0) {
                            if (this.pulse1.volumeEnvelopeUp) {
                                this.pulse1.volume += 1;
                                this.pulse1.volume &= 0xF;
                            } else {
                                this.pulse1.volume += 2;
                                this.pulse1.volume &= 0xF;
                            }
                        }

                        if (this.pulse1.volumeEnvelopeUp !== newUp)
                            this.pulse1.volume = 0;
                    }

                    this.pulse1.volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.pulse1.volumeEnvelopeUp = newUp;
                    this.pulse1.volumeEnvelopeSweep = value & 0b111;
                    this.pulse1.dacEnabled = (value & 0b11111000) !== 0;
                    if (!this.pulse1.dacEnabled) this.pulse1.enabled = false;
                    break;
                case 0xFF13: // NR13 Low bits
                    this.pulse1.frequencyLower = value;
                    this.calcPulse1Period();
                    break;
                case 0xFF14: // NR14
                    this.pulse1.frequencyUpper = value & 0b111;
                    this.pulse1.lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) {
                        this.pulse1.trigger();
                        this.frameSequencerFrequencySweep();

                        this.freqSweepEnabled = this.pulse1.freqSweepShift !== 0 || this.pulse1.freqSweepPeriod !== 0;

                        // if (this.pulse1.freqSweepShift > 0) {
                        //     this.applyFrequencySweep();
                        // }

                        this.reloadPulse1Period();
                    }
                    this.calcPulse1Period();
                    break;

                // Pulse 2
                case 0xFF16: // NR21
                    this.pulse2.width = value >> 6;
                    this.pulse2.lengthCounter = 64 - (value & 0b111111);
                    break;
                case 0xFF17: // NR22
                    {
                        const newUp = ((value >> 3) & 1) === 1;

                        if (this.pulse2.enabled) {
                            if (this.pulse2.volumeEnvelopeSweep === 0) {
                                if (this.pulse2.volumeEnvelopeUp) {
                                    this.pulse2.volume += 1;
                                    this.pulse2.volume &= 0xF;
                                } else {
                                    this.pulse2.volume += 2;
                                    this.pulse2.volume &= 0xF;
                                }
                            }

                            if (this.pulse2.volumeEnvelopeUp !== newUp)
                                this.pulse2.volume = 0;
                        }

                        this.pulse2.volumeEnvelopeStart = (value >> 4) & 0xF;
                        this.pulse2.volumeEnvelopeUp = newUp;
                        this.pulse2.volumeEnvelopeSweep = value & 0b111;
                        this.pulse2.dacEnabled = (value & 0b11111000) !== 0;
                        if (!this.pulse2.dacEnabled) this.pulse2.enabled = false;
                    }
                    break;
                case 0xFF18: // NR23
                    this.pulse2.frequencyLower = value;
                    this.calcPulse2Period();
                    break;
                case 0xFF19: // NR24
                    this.pulse2.frequencyUpper = value & 0b111;
                    this.pulse2.lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) {
                        this.pulse2.trigger();
                        this.reloadPulse2Period();
                    }
                    this.calcPulse2Period();
                    break;

                // Wave
                case 0xFF1A: // NR30
                    this.wave.dacEnabled = (value & 0x80) !== 0;
                    if (!this.wave.dacEnabled) this.wave.enabled = false;
                    break;
                case 0xFF1B: // NR31
                    this.wave.lengthCounter = 256 - value;
                    break;
                case 0xFF1C: // NR32
                    this.wave.volume = (value >> 5) & 0b11;
                    break;
                case 0xFF1D: // NR33
                    this.wave.frequencyLower = value;
                    this.calcWavePeriod();
                    break;
                case 0xFF1E: // NR34
                    this.wave.frequencyUpper = value & 0b111;
                    if (((value >> 7) & 1) !== 0) {
                        this.wave.trigger();
                        this.wavePos = 0;
                        this.reloadWavePeriod();
                    }
                    this.wave.lengthEnable = ((value >> 6) & 1) !== 0;
                    this.calcWavePeriod();
                    break;

                // Noise
                case 0xFF20: // NR41
                    this.noise.lengthCounter = 64 - (value & 0b111111); // 6 bits
                    break;
                case 0xFF21: // NR42
                    this.noise.volume = (value >> 4) & 0xF;
                    this.noise.volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.noise.volumeEnvelopeUp = ((value >> 3) & 1) === 1;
                    this.noise.volumeEnvelopeSweep = value & 0b111;
                    this.noise.dacEnabled = (value & 0b11111000) != 0;
                    if (!this.noise.dacEnabled) this.noise.enabled = false;
                    break;
                case 0xFF22: // NR43
                    this.noise.shiftClockFrequency = (value >> 4) & 0xF;
                    this.noise.counterStep = ((value >> 3) & 1) !== 0;
                    this.noise.divisorCode = (value & 0b111);
                    this.calcNoisePeriod();
                    break;
                case 0xFF23: // NR44
                    if (((value >> 7) & 1) !== 0) {
                        this.noise.trigger();
                        this.noisePos = 0;
                        this.reloadNoisePeriod();
                    }
                    this.noise.lengthEnable = ((value >> 6) & 1) !== 0;
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

                this.pulse1Pos = 0;
                this.pulse2Pos = 0;

                for (let i = 0xFF10; i <= 0xFF25; i++) {
                    this.soundRegisters[i - 0xFF10] = 0;
                }
                this.enabled = false;
            }
        }
    }

    readHwio(addr: number): number {
        if (addr >= 0xFF10 && addr <= 0xFF3F) {
            let i = this.soundRegisters[addr - 0xFF10];

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
        state.PUT_BOOL(this.enabled);

        state.PUT_16LE(this.ticksEnvelopePulse1);
        state.PUT_16LE(this.ticksEnvelopePulse2);
        state.PUT_16LE(this.ticksEnvelopeNoise);

        state.PUT_16LE(this.clockPulse1FreqSweep);
        state.PUT_BOOL(this.freqSweepEnabled);

        state.PUT_8(this.frameSequencerStep);

        state.PUT_BOOL(this.pulse1.enabled);
        state.PUT_8(this.pulse1.width);
        state.PUT_BOOL(this.pulse1.dacEnabled);
        state.PUT_BOOL(this.pulse1.lengthEnable);
        state.PUT_8(this.pulse1.lengthCounter);
        state.PUT_8(this.pulse1.frequencyUpper);
        state.PUT_8(this.pulse1.frequencyLower);
        state.PUT_8(this.pulse1.volume);
        state.PUT_BOOL(this.pulse1.volumeEnvelopeUp);
        state.PUT_8(this.pulse1.volumeEnvelopeSweep);
        state.PUT_8(this.pulse1.volumeEnvelopeStart);
        state.PUT_8(this.pulse1.oldVolume);
        state.PUT_BOOL(this.pulse1.outputLeft);
        state.PUT_BOOL(this.pulse1.outputRight);
        state.PUT_8(this.pulse1.freqSweepPeriod);
        state.PUT_BOOL(this.pulse1.freqSweepUp);
        state.PUT_8(this.pulse1.freqSweepShift);

        state.PUT_BOOL(this.pulse2.enabled);
        state.PUT_8(this.pulse2.width);
        state.PUT_BOOL(this.pulse2.dacEnabled);
        state.PUT_BOOL(this.pulse2.lengthEnable);
        state.PUT_8(this.pulse2.lengthCounter);
        state.PUT_8(this.pulse2.frequencyUpper);
        state.PUT_8(this.pulse2.frequencyLower);
        state.PUT_8(this.pulse2.volume);
        state.PUT_BOOL(this.pulse2.volumeEnvelopeUp);
        state.PUT_8(this.pulse2.volumeEnvelopeSweep);
        state.PUT_8(this.pulse2.volumeEnvelopeStart);
        state.PUT_8(this.pulse2.oldVolume);
        state.PUT_BOOL(this.pulse2.outputLeft);
        state.PUT_BOOL(this.pulse2.outputRight);
        state.PUT_8(this.pulse2.freqSweepPeriod);
        state.PUT_BOOL(this.pulse2.freqSweepUp);
        state.PUT_8(this.pulse2.freqSweepShift);

        state.PUT_BOOL(this.wave.enabled);
        state.PUT_BOOL(this.wave.dacEnabled);
        state.PUT_BOOL(this.wave.lengthEnable);
        state.PUT_8(this.wave.lengthCounter);
        state.PUT_8(this.wave.frequencyUpper);
        state.PUT_8(this.wave.frequencyLower);
        state.PUT_8(this.wave.volume);
        state.PUT_8(this.wave.oldVolume);
        state.PUT_8ARRAY(this.wave.waveTable, 32);
        state.PUT_BOOL(this.wave.waveTableUpdated);
        state.PUT_BOOL(this.wave.outputLeft);
        state.PUT_BOOL(this.wave.outputRight);

        state.PUT_BOOL(this.noise.enabled);
        state.PUT_8(this.noise.divisorCode);
        state.PUT_BOOL(this.noise.lengthEnable);
        state.PUT_8(this.noise.lengthCounter);
        state.PUT_BOOL(this.noise.dacEnabled);
        state.PUT_8(this.noise.volume);
        state.PUT_BOOL(this.noise.volumeEnvelopeUp);
        state.PUT_8(this.noise.volumeEnvelopeSweep);
        state.PUT_8(this.noise.volumeEnvelopeStart);
        state.PUT_BOOL(this.noise.outputLeft);
        state.PUT_BOOL(this.noise.outputRight);
        state.PUT_8(this.noise.shiftClockFrequency);
        state.PUT_BOOL(this.noise.counterStep);
        state.PUT_8(this.noise.envelopeSweep);

        state.PUT_8ARRAY(this.soundRegisters, 64);

        state.PUT_16LE(this.pulse1FreqTimer);
        state.PUT_16LE(this.pulse2FreqTimer);
        state.PUT_16LE(this.waveFreqTimer);
        state.PUT_16LE(this.noiseFreqTimer);

        state.PUT_16LE(this.pulse1Pos);
        state.PUT_16LE(this.pulse2Pos);
        state.PUT_16LE(this.wavePos);
        state.PUT_16LE(this.noisePos);

        state.PUT_16LE(this.sampleTimer);

        state.PUT_16LE(this.pulse1Period);
        state.PUT_16LE(this.pulse2Period);
        state.PUT_16LE(this.wavePeriod);
        state.PUT_16LE(this.noisePeriod);

        state.PUT_16LE(this.capacitor1);
        state.PUT_16LE(this.capacitor2);
    }

    deserialize(state: Serializer) {
        this.enabled = state.GET_BOOL();

        this.ticksEnvelopePulse1 = state.GET_16LE();
        this.ticksEnvelopePulse2 = state.GET_16LE();
        this.ticksEnvelopeNoise = state.GET_16LE();

        this.clockPulse1FreqSweep = state.GET_16LE();
        this.freqSweepEnabled = state.GET_BOOL();

        this.frameSequencerStep = state.GET_8();

        this.pulse1.enabled = state.GET_BOOL();
        this.pulse1.width = state.GET_8();
        this.pulse1.dacEnabled = state.GET_BOOL();
        this.pulse1.lengthEnable = state.GET_BOOL();
        this.pulse1.lengthCounter = state.GET_8();
        this.pulse1.frequencyUpper = state.GET_8();
        this.pulse1.frequencyLower = state.GET_8();
        this.pulse1.volume = state.GET_8();
        this.pulse1.volumeEnvelopeUp = state.GET_BOOL();
        this.pulse1.volumeEnvelopeSweep = state.GET_8();
        this.pulse1.volumeEnvelopeStart = state.GET_8();
        this.pulse1.oldVolume = state.GET_8();
        this.pulse1.outputLeft = state.GET_BOOL();
        this.pulse1.outputRight = state.GET_BOOL();
        this.pulse1.freqSweepPeriod = state.GET_8();
        this.pulse1.freqSweepUp = state.GET_BOOL();
        this.pulse1.freqSweepShift = state.GET_8();

        this.pulse2.enabled = state.GET_BOOL();
        this.pulse2.width = state.GET_8();
        this.pulse2.dacEnabled = state.GET_BOOL();
        this.pulse2.lengthEnable = state.GET_BOOL();
        this.pulse2.lengthCounter = state.GET_8();
        this.pulse2.frequencyUpper = state.GET_8();
        this.pulse2.frequencyLower = state.GET_8();
        this.pulse2.volume = state.GET_8();
        this.pulse2.volumeEnvelopeUp = state.GET_BOOL();
        this.pulse2.volumeEnvelopeSweep = state.GET_8();
        this.pulse2.volumeEnvelopeStart = state.GET_8();
        this.pulse2.oldVolume = state.GET_8();
        this.pulse2.outputLeft = state.GET_BOOL();
        this.pulse2.outputRight = state.GET_BOOL();
        this.pulse2.freqSweepPeriod = state.GET_8();
        this.pulse2.freqSweepUp = state.GET_BOOL();
        this.pulse2.freqSweepShift = state.GET_8();

        this.wave.enabled = state.GET_BOOL();
        this.wave.dacEnabled = state.GET_BOOL();
        this.wave.lengthEnable = state.GET_BOOL();
        this.wave.lengthCounter = state.GET_8();
        this.wave.frequencyUpper = state.GET_8();
        this.wave.frequencyLower = state.GET_8();
        this.wave.volume = state.GET_8();
        this.wave.oldVolume = state.GET_8();
        this.wave.waveTable = state.GET_8ARRAY(32);
        this.wave.waveTableUpdated = state.GET_BOOL();
        this.wave.outputLeft = state.GET_BOOL();
        this.wave.outputRight = state.GET_BOOL();

        this.noise.enabled = state.GET_BOOL();
        this.noise.divisorCode = state.GET_8();
        this.noise.lengthEnable = state.GET_BOOL();
        this.noise.lengthCounter = state.GET_8();
        this.noise.dacEnabled = state.GET_BOOL();
        this.noise.volume = state.GET_8();
        this.noise.volumeEnvelopeUp = state.GET_BOOL();
        this.noise.volumeEnvelopeSweep = state.GET_8();
        this.noise.volumeEnvelopeStart = state.GET_8();
        this.noise.outputLeft = state.GET_BOOL();
        this.noise.outputRight = state.GET_BOOL();
        this.noise.shiftClockFrequency = state.GET_8();
        this.noise.counterStep = state.GET_BOOL();
        this.noise.envelopeSweep = state.GET_8();

        this.soundRegisters = state.GET_8ARRAY(64);

        this.pulse1FreqTimer = state.GET_16LE();
        this.pulse2FreqTimer = state.GET_16LE();
        this.waveFreqTimer = state.GET_16LE();
        this.noiseFreqTimer = state.GET_16LE();
        this.pulse1Pos = state.GET_16LE();
        this.pulse2Pos = state.GET_16LE();
        this.wavePos = state.GET_16LE();
        this.noisePos = state.GET_16LE();
        this.sampleTimer = state.GET_16LE();
        this.pulse1Period = state.GET_16LE();
        this.pulse2Period = state.GET_16LE();
        this.wavePeriod = state.GET_16LE();
        this.noisePeriod = state.GET_16LE();
        this.capacitor1 = state.GET_16LE();
        this.capacitor2 = state.GET_16LE();

        if (this.ap) {
            this.ap.noise(this);
            this.ap.pulse1(this);
            this.ap.pulse2(this);
            this.ap.updateWaveTable(this);
        }
    }
}