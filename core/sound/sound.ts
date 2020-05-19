import GameBoy from "../gameboy";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { AudioPlugin } from "./audioplugin";
import { HWIO } from "../memory/hwio";
import { BIT_7, BIT_3, BIT_2, BIT_1, BIT_0, BIT_4, BIT_5, BIT_6 } from "../bit_constants";
import { Serializer } from "../serialize";
import { SoundPlayer, SAMPLE_RATE, NORMAL_SAMPLE_RATE } from "./soundplayer";
import { hex } from "../../src/gameboy/tools/util";

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

    ap: AudioPlugin | null = null;

    soundRegisters = new Uint8Array(64).fill(0);

    advanceFrameSequencer() {
        if (this.enabled) {
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
    }

    nightcoreMode = false;

    vinLeftEnable = false;
    vinRightEnable = false;
    leftMasterVol = 0;
    rightMasterVol = 0;
    leftMasterVolMul = 0;
    rightMasterVolMul = 0;

    pulse1Val = 0;
    pulse2Val = 0;
    waveVal = 0;
    noiseVal = 0;

    pulse1Pos = 0;
    pulse2Pos = 0;
    wavePos = 0;
    noisePos = 0;

    pulse1FreqTimer = 0;
    pulse2FreqTimer = 0;
    waveFreqTimer = 0;
    noiseFreqTimer = 0;

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

    calcPulse1Period() {
        this.pulse1Period = (2048 - ((this.pulse1_frequencyUpper << 8) | this.pulse1_frequencyLower)) * 4;
        if (this.nightcoreMode) this.pulse1Period *= 0.5;
    }
    calcPulse2Period() {
        this.pulse2Period = (2048 - ((this.pulse2_frequencyUpper << 8) | this.pulse2_frequencyLower)) * 4;
        if (this.nightcoreMode) this.pulse2Period *= 0.5;
    }
    calcWavePeriod() {
        this.wavePeriod = (2048 - ((this.wave_frequencyUpper << 8) | this.wave_frequencyLower)) * 2;
        if (this.nightcoreMode) this.wavePeriod *= 0.5;
    }
    calcNoisePeriod() {
        this.noisePeriod = ([8, 16, 32, 48, 64, 80, 96, 112][this.noise_divisorCode] << this.noise_shiftClockFrequency);
    }

    reloadPulse1Period() { this.pulse1FreqTimer = this.pulse1Period; }
    reloadPulse2Period() { this.pulse2FreqTimer = this.pulse2Period; }
    reloadWavePeriod() { this.waveFreqTimer = this.wavePeriod; }
    reloadNoisePeriod() { this.noiseFreqTimer = this.noisePeriod; }

    pulse1_enabled = false;
    pulse1_width = 3;
    pulse1_dacEnabled = false;
    pulse1_lengthEnable = false;
    pulse1_lengthCounter = 0;
    pulse1_frequencyUpper = 0;
    pulse1_frequencyLower = 0;
    pulse1_volume = 0;
    pulse1_volumeEnvelopeUp = false;
    pulse1_volumeEnvelopeSweep = 4;
    pulse1_volumeEnvelopeStart = 0;
    pulse1_outputLeft = false;
    pulse1_outputRight = false;
    pulse1_freqSweepPeriod = 0;
    pulse1_freqSweepUp = false;
    pulse1_freqSweepShift = 0;
    pulse1_updated = true;
    pulse1_trigger() {
        if (this.pulse1_lengthCounter === 0 || this.pulse1_lengthEnable == false) {
            this.pulse1_lengthCounter = 64;
        }
        this.pulse1_volume = this.pulse1_volumeEnvelopeStart;
        if (this.pulse1_dacEnabled) {
            this.pulse1_enabled = true;
        }
        this.clockPulse1FreqSweep = 0;

        this.frameSequencerFrequencySweep();
        this.freqSweepEnabled = this.pulse1_freqSweepShift !== 0 || this.pulse1_freqSweepPeriod !== 0;
        this.reloadPulse1Period();
        this.updatePulse1Val();
    }
    pulse1_getFrequencyHz(): number {
        const frequency = (this.pulse1_frequencyUpper << 8) | this.pulse1_frequencyLower;
        return 131072 / (2048 - frequency);
    }

    pulse2_enabled = false;
    pulse2_width = 3;
    pulse2_dacEnabled = false;
    pulse2_lengthEnable = false;
    pulse2_lengthCounter = 0;
    pulse2_frequencyUpper = 0;
    pulse2_frequencyLower = 0;
    pulse2_volume = 0;
    pulse2_volumeEnvelopeUp = false;
    pulse2_volumeEnvelopeSweep = 4;
    pulse2_volumeEnvelopeStart = 0;
    pulse2_outputLeft = false;
    pulse2_outputRight = false;
    pulse2_updated = true;
    pulse2_trigger() {
        if (this.pulse2_lengthCounter === 0 || this.pulse2_lengthEnable == false) {
            this.pulse2_lengthCounter = 64;
        }
        this.pulse2_volume = this.pulse2_volumeEnvelopeStart;
        if (this.pulse2_dacEnabled) {
            this.pulse2_enabled = true;
        }
        this.reloadPulse2Period();
        this.updatePulse2Val();
    }
    pulse2_getFrequencyHz(): number {
        const frequency = (this.pulse2_frequencyUpper << 8) | this.pulse2_frequencyLower;
        return 131072 / (2048 - frequency);
    }

    wave_enabled = false;
    wave_dacEnabled = false;
    wave_lengthEnable = true;
    wave_lengthCounter = 0;
    wave_frequencyUpper = 0;
    wave_frequencyLower = 0;
    wave_volume = 0;
    wave_oldVolume = 0;
    wave_waveTable: Uint8Array = new Uint8Array(32);
    wave_waveTableUpdated = true;
    wave_outputLeft = false;
    wave_outputRight = false;
    wave_getFrequencyHz(): number {
        const frequency = (this.wave_frequencyUpper << 8) | this.wave_frequencyLower;
        return 65536 / (2048 - frequency);
    }

    noise_enabled = false;
    noise_divisorCode = 0;
    noise_lengthEnable = false;
    noise_lengthCounter = 0;
    noise_dacEnabled = false;
    noise_volume = 0;
    noise_volumeEnvelopeUp = false;
    noise_volumeEnvelopeSweep = 4;
    noise_volumeEnvelopeStart = 0;
    noise_outputLeft = false;
    noise_outputRight = false;
    noise_shiftClockFrequency = 0;
    noise_counterStep = false;
    noise_envelopeSweep = 0;

    noise_trigger() {
        if (this.noise_dacEnabled)
            this.noise_enabled = true;

        if (this.noise_lengthCounter === 0 || this.noise_lengthEnable == false) {
            this.noise_lengthCounter = 64;
        }
        this.noise_volume = this.noise_volumeEnvelopeStart;
        this.updateNoiseVal();
    }

    wave_trigger() {
        if (this.wave_lengthCounter === 0 || this.wave_lengthEnable == false) {
            this.wave_lengthCounter = 256;
        }
        if (this.wave_dacEnabled) {
            this.wave_enabled = true;
        }
        this.updateWaveVal();
    }

    updatePulse1Val() {
        this.pulse1Val = this.pulse1_enabled ? DAC_TABLE[PULSE_DUTY[this.pulse1_width][this.pulse1Pos] * this.pulse1_volume] : -1;
    }
    updatePulse2Val() {
        this.pulse2Val = this.pulse2_enabled ? DAC_TABLE[PULSE_DUTY[this.pulse2_width][this.pulse2Pos] * this.pulse2_volume] : -1;
    }
    updateWaveVal() {
        this.waveVal = this.wave_enabled ? DAC_TABLE[this.wave_waveTable[this.wavePos] >> [4, 0, 1, 2][this.wave_volume]] : -1;
    }
    updateNoiseVal() {
        this.noiseVal = this.noise_enabled ? DAC_TABLE[(this.noise_counterStep ? SEVEN_BIT_NOISE[this.noisePos] : FIFTEEN_BIT_NOISE[this.noisePos]) * this.noise_volume] : -1;
    }

    tick(cycles: number) {
        if (this.enabled) {
            if (this.pulse1_enabled) {
                this.pulse1FreqTimer -= cycles;
                if (this.pulse1FreqTimer <= 0) {
                    this.pulse1FreqTimer += this.pulse1Period;

                    this.pulse1Pos++;
                    this.pulse1Pos &= 7;

                    this.updatePulse1Val();
                }
            }

            if (this.pulse2_enabled) {
                this.pulse2FreqTimer -= cycles;
                if (this.pulse2FreqTimer <= 0) {
                    this.pulse2FreqTimer += this.pulse2Period;

                    this.pulse2Pos++;
                    this.pulse2Pos &= 7;

                    this.updatePulse2Val();
                }
            }

            if (this.wave_enabled) {
                this.waveFreqTimer -= cycles;
                if (this.waveFreqTimer <= 0) {
                    this.waveFreqTimer += this.wavePeriod;

                    this.wavePos++;
                    this.wavePos &= 31;

                    this.updateWaveVal();
                }
            }

            if (this.noise_enabled) {
                this.noiseFreqTimer -= cycles;
                if (this.noiseFreqTimer <= 0) {
                    this.noiseFreqTimer += this.noisePeriod;

                    this.noisePos++;
                    this.noisePos &= 32767;

                    this.updateNoiseVal();
                }
            }

            if (!this.gb.turbo) {
                this.sampleTimer += cycles;
                // Sample at 65536 Hz
                if (this.sampleTimer >= (4194304 / SAMPLE_RATE)) {
                    this.sampleTimer -= (4194304 / SAMPLE_RATE);

                    let in1 = 0;
                    let in2 = 0;

                    // Note: -1 value when disabled is the DAC DC offset

                    if (this.pulse1_dacEnabled) {
                        if (this.pulse1_outputLeft) in1 += this.pulse1Val;
                        if (this.pulse1_outputRight) in2 += this.pulse1Val;
                    }

                    if (this.pulse2_dacEnabled) {
                        if (this.pulse2_outputLeft) in1 += this.pulse2Val;
                        if (this.pulse2_outputRight) in2 += this.pulse2Val;
                    }

                    if (this.wave_dacEnabled) {
                        if (this.wave_outputLeft) in1 += this.waveVal;
                        if (this.wave_outputRight) in2 += this.waveVal;
                    }

                    if (this.noise_dacEnabled) {
                        if (this.noise_outputLeft) in1 += this.noiseVal;
                        if (this.noise_outputRight) in2 += this.noiseVal;
                    }

                    in1 *= this.leftMasterVolMul;
                    in2 *= this.rightMasterVolMul;

                    let out1 = in1 - this.capacitor1;
                    let out2 = in2 - this.capacitor2;

                    this.audioQueueLeft[this.audioQueueAt] = (out1 * 0.25);
                    this.audioQueueRight[this.audioQueueAt] = (out2 * 0.25);

                    this.capacitor1 = in1 - out1 * CAPACITOR_FACTOR;
                    this.capacitor2 = in2 - out2 * CAPACITOR_FACTOR;

                    this.audioQueueAt++;

                    if (this.audioQueueAt >= 4096 / (NORMAL_SAMPLE_RATE / SAMPLE_RATE)) {
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
    }

    soundPlayer = new SoundPlayer();

    resetPlayer() {
        this.soundPlayer.reset();
    }

    private frameSequencerFrequencySweep() {
        // writeDebug("Frequency sweep")
        let actualPeriod = this.pulse1_freqSweepPeriod;
        if (actualPeriod == 0) actualPeriod = 8;
        if (this.clockPulse1FreqSweep > actualPeriod) {
            this.clockPulse1FreqSweep = 0;
            if (this.freqSweepEnabled === true) {
                this.applyFrequencySweep();
            }

            // writeDebug("abs(Range): " + diff);
            // writeDebug("Resulting frequency: " + this.pulse1_frequencyHz);

        }

        this.clockPulse1FreqSweep++;
    }

    private applyFrequencySweep() {
        let freq = (this.pulse1_frequencyUpper << 8) | this.pulse1_frequencyLower;
        const diff = freq >> this.pulse1_freqSweepShift;
        const newFreq = this.pulse1_freqSweepUp ? freq + diff : freq - diff;
        freq = newFreq;
        if (newFreq > 2047) {
            this.pulse1_enabled = false;
        }
        if (this.pulse1_freqSweepPeriod !== 0 && this.pulse1_freqSweepShift !== 0) {

            this.pulse1_frequencyLower = freq & 0xFF;
            this.pulse1_frequencyUpper = (freq >> 8) & 0xFF;
        }

        this.calcPulse1Period();
        this.updatePulse1Val();
    }

    private frameSequencerVolumeEnvelope() {
        this.ticksEnvelopePulse1--;
        if (this.ticksEnvelopePulse1 <= 0) {
            if (this.pulse1_volumeEnvelopeSweep !== 0) {
                if (this.pulse1_volumeEnvelopeUp === true) {
                    if (this.pulse1_volume < 15) {
                        this.pulse1_volume++;
                    }
                } else {
                    if (this.pulse1_volume > 0) {
                        this.pulse1_volume--;
                    }
                }
                this.updatePulse1Val();
            }
            this.ticksEnvelopePulse1 = this.pulse1_volumeEnvelopeSweep;
        }

        this.ticksEnvelopePulse2--;
        if (this.ticksEnvelopePulse2 <= 0) {
            if (this.pulse2_volumeEnvelopeSweep !== 0) {
                if (this.pulse2_volumeEnvelopeUp === true) {
                    if (this.pulse2_volume < 15) {
                        this.pulse2_volume++;
                    }
                } else {
                    if (this.pulse2_volume > 0) {
                        this.pulse2_volume--;
                    }
                }
                this.updatePulse2Val();
            }
            this.ticksEnvelopePulse2 = this.pulse2_volumeEnvelopeSweep;
        }

        this.ticksEnvelopeNoise--;
        if (this.ticksEnvelopeNoise <= 0) {
            if (this.noise_volumeEnvelopeSweep !== 0) {
                if (this.noise_volumeEnvelopeUp === true) {
                    if (this.noise_volume < 15) {
                        this.noise_volume++;
                    }
                } else {
                    if (this.noise_volume > 0) {
                        this.noise_volume--;
                    }
                }
                this.updateNoiseVal();
            }
            this.ticksEnvelopeNoise = this.noise_volumeEnvelopeSweep;
        }
    }

    private frameSequencerLength() {
        if (this.pulse1_lengthEnable === true && this.pulse1_lengthCounter > 0) {
            this.pulse1_lengthCounter--;
            if (this.pulse1_lengthCounter === 0) {
                this.pulse1_enabled = false;
                this.updatePulse1Val();
            }
        }

        if (this.pulse2_lengthEnable === true && this.pulse2_lengthCounter > 0) {
            this.pulse2_lengthCounter--;
            if (this.pulse2_lengthCounter === 0) {
                this.pulse2_enabled = false;
                this.updatePulse2Val();
            }
        }

        if (this.wave_lengthEnable === true && this.wave_lengthCounter > 0) {
            this.wave_lengthCounter--;
            if (this.wave_lengthCounter === 0) {
                this.wave_enabled = false;
                this.updateWaveVal();
            }
        }

        if (this.noise_lengthEnable === true && this.noise_lengthCounter > 0) {
            this.noise_lengthCounter--;
            if (this.noise_lengthCounter === 0) {
                this.noise_enabled = false;
                this.updateNoiseVal();
            }
        }

        if (this.wave_waveTableUpdated === true) {
            if (this.ap !== null)
                this.ap.updateWaveTable(this);
            this.wave_waveTableUpdated = false;
        }
    }

    writeHwio(addr: number, value: number) {
        if (this.enabled) {
            switch (addr) {
                // Pulse 1
                case 0xFF10: // NR10
                    this.pulse1_freqSweepPeriod = (value & 0b01110000) >> 4; // in 128ths of a second (0-7)
                    this.pulse1_freqSweepUp = ((value >> 3) & 1) === 0; // 0 === Add, 1 = Sub
                    this.pulse1_freqSweepShift = (value & 0b111); // 0-7; 
                    this.updatePulse1Val();
                    break;
                case 0xFF11: // NR11
                    this.pulse1_width = value >> 6;
                    this.pulse1_lengthCounter = 64 - (value & 0b111111);
                    this.pulse1Val = PULSE_DUTY[this.pulse1_width][this.pulse1Pos];
                    this.updatePulse1Val();
                    break;
                case 0xFF12: // NR12
                    const newUp = ((value >> 3) & 1) === 1;

                    if (this.pulse1_enabled) {
                        if (this.pulse1_volumeEnvelopeSweep === 0) {
                            if (this.pulse1_volumeEnvelopeUp) {
                                this.pulse1_volume += 1;
                                this.pulse1_volume &= 0xF;
                            } else {
                                this.pulse1_volume += 2;
                                this.pulse1_volume &= 0xF;
                            }
                        }

                        if (this.pulse1_volumeEnvelopeUp !== newUp)
                            this.pulse1_volume = 0;
                    }

                    this.pulse1_volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.pulse1_volumeEnvelopeUp = newUp;
                    this.pulse1_volumeEnvelopeSweep = value & 0b111;
                    this.pulse1_dacEnabled = (value & 0b11111000) !== 0;
                    if (!this.pulse1_dacEnabled) this.pulse1_enabled = false;
                    this.updatePulse1Val();
                    break;
                case 0xFF13: // NR13 Low bits
                    this.pulse1_frequencyLower = value;
                    this.calcPulse1Period();
                    this.updatePulse1Val();
                    break;
                case 0xFF14: // NR14
                    this.pulse1_frequencyUpper = value & 0b111;
                    this.pulse1_lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) {
                        this.pulse1_trigger();
                    }
                    this.calcPulse1Period();
                    this.updatePulse1Val();
                    break;

                // Pulse 2
                case 0xFF16: // NR21
                    this.pulse2_width = value >> 6;
                    this.pulse2_lengthCounter = 64 - (value & 0b111111);
                    this.pulse2Val = PULSE_DUTY[this.pulse2_width][this.pulse2Pos];
                    this.updatePulse2Val();
                    break;
                case 0xFF17: // NR22
                    {
                        const newUp = ((value >> 3) & 1) === 1;

                        if (this.pulse2_enabled) {
                            if (this.pulse2_volumeEnvelopeSweep === 0) {
                                if (this.pulse2_volumeEnvelopeUp) {
                                    this.pulse2_volume += 1;
                                    this.pulse2_volume &= 0xF;
                                } else {
                                    this.pulse2_volume += 2;
                                    this.pulse2_volume &= 0xF;
                                }
                            }

                            if (this.pulse2_volumeEnvelopeUp !== newUp)
                                this.pulse2_volume = 0;
                        }

                        this.pulse2_volumeEnvelopeStart = (value >> 4) & 0xF;
                        this.pulse2_volumeEnvelopeUp = newUp;
                        this.pulse2_volumeEnvelopeSweep = value & 0b111;
                        this.pulse2_dacEnabled = (value & 0b11111000) !== 0;
                        if (!this.pulse2_dacEnabled) this.pulse2_enabled = false;
                    }
                    this.updatePulse2Val();
                    break;
                case 0xFF18: // NR23
                    this.pulse2_frequencyLower = value;
                    this.calcPulse2Period();
                    this.updatePulse2Val();
                    break;
                case 0xFF19: // NR24
                    this.pulse2_frequencyUpper = value & 0b111;
                    this.pulse2_lengthEnable = ((value >> 6) & 1) !== 0;
                    if (((value >> 7) & 1) !== 0) {
                        this.pulse2_trigger();
                    }
                    this.calcPulse2Period();
                    this.updatePulse2Val();
                    break;

                // Wave
                case 0xFF1A: // NR30
                    this.wave_dacEnabled = (value & 0x80) !== 0;
                    if (!this.wave_dacEnabled) this.wave_enabled = false;
                    this.updateWaveVal();
                    break;
                case 0xFF1B: // NR31
                    this.wave_lengthCounter = 256 - value;
                    this.updateWaveVal();
                    break;
                case 0xFF1C: // NR32
                    this.wave_volume = (value >> 5) & 0b11;
                    this.updateWaveVal();
                    break;
                case 0xFF1D: // NR33
                    this.wave_frequencyLower = value;
                    this.calcWavePeriod();
                    this.updateWaveVal();
                    break;
                case 0xFF1E: // NR34
                    this.wave_frequencyUpper = value & 0b111;
                    if (((value >> 7) & 1) !== 0) {
                        this.wave_trigger();
                        this.wavePos = 0;
                        this.reloadWavePeriod();
                    }
                    this.wave_lengthEnable = ((value >> 6) & 1) !== 0;
                    this.calcWavePeriod();
                    this.updateWaveVal();
                    break;

                // Noise
                case 0xFF20: // NR41
                    this.noise_lengthCounter = 64 - (value & 0b111111); // 6 bits
                    this.updateNoiseVal();
                    break;
                case 0xFF21: // NR42
                    this.noise_volume = (value >> 4) & 0xF;
                    this.noise_volumeEnvelopeStart = (value >> 4) & 0xF;
                    this.noise_volumeEnvelopeUp = ((value >> 3) & 1) === 1;
                    this.noise_volumeEnvelopeSweep = value & 0b111;
                    this.noise_dacEnabled = (value & 0b11111000) != 0;
                    if (!this.noise_dacEnabled) this.noise_enabled = false;
                    this.updateNoiseVal();
                    break;
                case 0xFF22: // NR43
                    this.noise_shiftClockFrequency = (value >> 4) & 0xF;
                    this.noise_counterStep = ((value >> 3) & 1) !== 0;
                    this.noise_divisorCode = (value & 0b111);
                    this.calcNoisePeriod();
                    this.updateNoiseVal();
                    break;
                case 0xFF23: // NR44
                    if (((value >> 7) & 1) !== 0) {
                        this.noise_trigger();
                        this.noisePos = 0;
                        this.reloadNoisePeriod();
                    }
                    this.noise_lengthEnable = ((value >> 6) & 1) !== 0;
                    this.updateNoiseVal();
                    break;

                case 0xFF24: // NR50
                    this.vinLeftEnable = (value & BIT_7) !== 0;
                    this.vinRightEnable = (value & BIT_3) !== 0;
                    this.leftMasterVol = (value >> 4) & 0b111;
                    this.rightMasterVol = (value >> 0) & 0b111;
                    this.leftMasterVolMul = this.leftMasterVol / 7;
                    this.rightMasterVolMul = this.rightMasterVol / 7;
                    break;

                // Panning
                case 0xFF25:
                    this.noise_outputRight = (value & BIT_7) !== 0;
                    this.wave_outputRight = (value & BIT_6) !== 0;
                    this.pulse2_outputRight = (value & BIT_5) !== 0;
                    this.pulse1_outputRight = (value & BIT_4) !== 0;

                    this.noise_outputLeft = (value & BIT_3) !== 0;
                    this.wave_outputLeft = (value & BIT_2) !== 0;
                    this.pulse2_outputLeft = (value & BIT_1) !== 0;
                    this.pulse1_outputLeft = (value & BIT_0) !== 0;

                    break;
            }

            if (addr >= 0xFF30 && addr <= 0xFF3F) {
                const BASE = 0xFF30;
                if (this.wave_enabled) {
                    // console.log(this.wavePos);
                    // console.log(`Addr: ${hex(((0xFF30 + (this.wavePos >> 1))), 4)} Value: ${hex(value, 2)}`);
                    this.soundRegisters[(0xFF30 + (this.wavePos >> 1)) - 0xFF10] = value;
                } else {
                    this.soundRegisters[addr - 0xFF10] = value;
                    if (this.wave_waveTable[((addr - BASE) * 2) + 0] != (value >> 4)) {
                        this.wave_waveTable[((addr - BASE) * 2) + 0] = value >> 4;
                        this.wave_waveTableUpdated = true;
                    }
                    if (this.wave_waveTable[((addr - BASE) * 2) + 1] != (value & 0xF)) {
                        this.wave_waveTable[((addr - BASE) * 2) + 1] = value & 0xF;
                        this.wave_waveTableUpdated = true;
                    }
                }
            } else {
                this.soundRegisters[addr - 0xFF10] = value;
            }
        }

        if (addr === 0xFF26) {
            // Control
            if (((value >> 7) & 1) !== 0) {
                // writeDebug("Enabled sound");
                this.enabled = true;
                this.frameSequencerStep = 0;
            } else {
                // Disable and write zeros on everything upon main disabling
                this.noise_enabled = false;
                this.wave_enabled = false;
                this.pulse2_enabled = false;
                this.pulse1_enabled = false;

                this.noise_dacEnabled = false;
                this.wave_dacEnabled = false;
                this.pulse2_dacEnabled = false;
                this.pulse1_dacEnabled = false;

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
                this.wavePos = 0;
                this.noisePos = 0;

                this.pulse1FreqTimer = 0;
                this.pulse2FreqTimer = 0;
                this.waveFreqTimer = 0;
                this.noiseFreqTimer = 0;

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

            if (addr >= 0xFF30 && addr <= 0xFF3F) {
                if (this.wave_enabled) {
                    return this.soundRegisters[(0xFF30 + (this.wavePos >> 1)) - 0xFF10];
                } else {
                    return this.soundRegisters[addr - 0xFF10];
                }
            }

            if (addr === 0xFF26) { // NR52
                i = 0;
                if (this.enabled) i |= BIT_7;
                i |= 0b01110000;
                if (this.noise_enabled && this.noise_dacEnabled) i |= BIT_3;
                if (this.wave_enabled && this.wave_dacEnabled) i |= BIT_2;
                if (this.pulse2_enabled && this.pulse2_dacEnabled) i |= BIT_1;
                if (this.pulse1_enabled && this.pulse1_dacEnabled) i |= BIT_0;
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

        this.pulse1_enabled = false;
        this.pulse1_width = 3;
        this.pulse1_dacEnabled = false;
        this.pulse1_lengthEnable = false;
        this.pulse1_lengthCounter = 0;
        this.pulse1_frequencyUpper = 0;
        this.pulse1_frequencyLower = 0;
        this.pulse1_volume = 0;
        this.pulse1_volumeEnvelopeUp = false;
        this.pulse1_volumeEnvelopeSweep = 4;
        this.pulse1_volumeEnvelopeStart = 0;
        this.pulse1_outputLeft = false;
        this.pulse1_outputRight = false;
        this.pulse1_freqSweepPeriod = 0;
        this.pulse1_freqSweepUp = false;
        this.pulse1_freqSweepShift = 0;
        this.pulse1_updated = true;
        this.pulse2_enabled = false;
        this.pulse2_width = 3;
        this.pulse2_dacEnabled = false;
        this.pulse2_lengthEnable = false;
        this.pulse2_lengthCounter = 0;
        this.pulse2_frequencyUpper = 0;
        this.pulse2_frequencyLower = 0;
        this.pulse2_volume = 0;
        this.pulse2_volumeEnvelopeUp = false;
        this.pulse2_volumeEnvelopeSweep = 4;
        this.pulse2_volumeEnvelopeStart = 0;
        this.pulse2_outputLeft = false;
        this.pulse2_outputRight = false;
        this.pulse2_updated = true;
        this.wave_enabled = false;
        this.wave_dacEnabled = false;
        this.wave_lengthEnable = true;
        this.wave_lengthCounter = 0;
        this.wave_frequencyUpper = 0;
        this.wave_frequencyLower = 0;
        this.wave_volume = 0;
        this.wave_oldVolume = 0;
        this.wave_waveTable = new Uint8Array(32);
        this.wave_waveTableUpdated = true;
        this.wave_outputLeft = false;
        this.wave_outputRight = false;
        this.noise_enabled = false;
        this.noise_divisorCode = 0;
        this.noise_lengthEnable = false;
        this.noise_lengthCounter = 0;
        this.noise_dacEnabled = false;
        this.noise_volume = 0;
        this.noise_volumeEnvelopeUp = false;
        this.noise_volumeEnvelopeSweep = 4;
        this.noise_volumeEnvelopeStart = 0;
        this.noise_outputLeft = false;
        this.noise_outputRight = false;
        this.noise_shiftClockFrequency = 0;
        this.noise_counterStep = false;
        this.noise_envelopeSweep = 0;

        this.pulse1Val = 0;
        this.pulse2Val = 0;
        this.waveVal = 0;
        this.noiseVal = 0;

        this.pulse1Val = DAC_TABLE[PULSE_DUTY[this.pulse1_width][this.pulse1Pos]];
        this.pulse2Val = DAC_TABLE[PULSE_DUTY[this.pulse2_width][this.pulse2Pos]];

        this.vinLeftEnable = false;
        this.vinRightEnable = false;
        this.leftMasterVol = 0;
        this.rightMasterVol = 0;
        this.leftMasterVolMul = 0;
        this.rightMasterVolMul = 0;
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

        state.PUT_BOOL(this.pulse1_enabled);
        state.PUT_8(this.pulse1_width);
        state.PUT_BOOL(this.pulse1_dacEnabled);
        state.PUT_BOOL(this.pulse1_lengthEnable);
        state.PUT_8(this.pulse1_lengthCounter);
        state.PUT_8(this.pulse1_frequencyUpper);
        state.PUT_8(this.pulse1_frequencyLower);
        state.PUT_8(this.pulse1_volume);
        state.PUT_BOOL(this.pulse1_volumeEnvelopeUp);
        state.PUT_8(this.pulse1_volumeEnvelopeSweep);
        state.PUT_8(this.pulse1_volumeEnvelopeStart);
        state.PUT_BOOL(this.pulse1_outputLeft);
        state.PUT_BOOL(this.pulse1_outputRight);
        state.PUT_8(this.pulse1_freqSweepPeriod);
        state.PUT_BOOL(this.pulse1_freqSweepUp);
        state.PUT_8(this.pulse1_freqSweepShift);

        state.PUT_BOOL(this.pulse2_enabled);
        state.PUT_8(this.pulse2_width);
        state.PUT_BOOL(this.pulse2_dacEnabled);
        state.PUT_BOOL(this.pulse2_lengthEnable);
        state.PUT_8(this.pulse2_lengthCounter);
        state.PUT_8(this.pulse2_frequencyUpper);
        state.PUT_8(this.pulse2_frequencyLower);
        state.PUT_8(this.pulse2_volume);
        state.PUT_BOOL(this.pulse2_volumeEnvelopeUp);
        state.PUT_8(this.pulse2_volumeEnvelopeSweep);
        state.PUT_8(this.pulse2_volumeEnvelopeStart);
        state.PUT_BOOL(this.pulse2_outputLeft);
        state.PUT_BOOL(this.pulse2_outputRight);

        state.PUT_BOOL(this.wave_enabled);
        state.PUT_BOOL(this.wave_dacEnabled);
        state.PUT_BOOL(this.wave_lengthEnable);
        state.PUT_8(this.wave_lengthCounter);
        state.PUT_8(this.wave_frequencyUpper);
        state.PUT_8(this.wave_frequencyLower);
        state.PUT_8(this.wave_volume);
        state.PUT_8(this.wave_oldVolume);
        state.PUT_8ARRAY(this.wave_waveTable, 32);
        state.PUT_BOOL(this.wave_waveTableUpdated);
        state.PUT_BOOL(this.wave_outputLeft);
        state.PUT_BOOL(this.wave_outputRight);

        state.PUT_BOOL(this.noise_enabled);
        state.PUT_8(this.noise_divisorCode);
        state.PUT_BOOL(this.noise_lengthEnable);
        state.PUT_8(this.noise_lengthCounter);
        state.PUT_BOOL(this.noise_dacEnabled);
        state.PUT_8(this.noise_volume);
        state.PUT_BOOL(this.noise_volumeEnvelopeUp);
        state.PUT_8(this.noise_volumeEnvelopeSweep);
        state.PUT_8(this.noise_volumeEnvelopeStart);
        state.PUT_BOOL(this.noise_outputLeft);
        state.PUT_BOOL(this.noise_outputRight);
        state.PUT_8(this.noise_shiftClockFrequency);
        state.PUT_BOOL(this.noise_counterStep);
        state.PUT_8(this.noise_envelopeSweep);

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

        state.PUT_BOOL(this.vinLeftEnable);
        state.PUT_BOOL(this.vinRightEnable);
        state.PUT_8(this.leftMasterVol);
        state.PUT_8(this.rightMasterVol);

        state.PUT_8(this.leftMasterVolMul);
        state.PUT_8(this.rightMasterVolMul);

        state.PUT_8(this.pulse1Val);
        state.PUT_8(this.pulse2Val);
        state.PUT_8(this.waveVal);
        state.PUT_8(this.noiseVal);
    }

    deserialize(state: Serializer) {
        this.enabled = state.GET_BOOL();

        this.ticksEnvelopePulse1 = state.GET_16LE();
        this.ticksEnvelopePulse2 = state.GET_16LE();
        this.ticksEnvelopeNoise = state.GET_16LE();

        this.clockPulse1FreqSweep = state.GET_16LE();
        this.freqSweepEnabled = state.GET_BOOL();

        this.frameSequencerStep = state.GET_8();

        this.pulse1_enabled = state.GET_BOOL();
        this.pulse1_width = state.GET_8();
        this.pulse1_dacEnabled = state.GET_BOOL();
        this.pulse1_lengthEnable = state.GET_BOOL();
        this.pulse1_lengthCounter = state.GET_8();
        this.pulse1_frequencyUpper = state.GET_8();
        this.pulse1_frequencyLower = state.GET_8();
        this.pulse1_volume = state.GET_8();
        this.pulse1_volumeEnvelopeUp = state.GET_BOOL();
        this.pulse1_volumeEnvelopeSweep = state.GET_8();
        this.pulse1_volumeEnvelopeStart = state.GET_8();
        this.pulse1_outputLeft = state.GET_BOOL();
        this.pulse1_outputRight = state.GET_BOOL();
        this.pulse1_freqSweepPeriod = state.GET_8();
        this.pulse1_freqSweepUp = state.GET_BOOL();
        this.pulse1_freqSweepShift = state.GET_8();

        this.pulse2_enabled = state.GET_BOOL();
        this.pulse2_width = state.GET_8();
        this.pulse2_dacEnabled = state.GET_BOOL();
        this.pulse2_lengthEnable = state.GET_BOOL();
        this.pulse2_lengthCounter = state.GET_8();
        this.pulse2_frequencyUpper = state.GET_8();
        this.pulse2_frequencyLower = state.GET_8();
        this.pulse2_volume = state.GET_8();
        this.pulse2_volumeEnvelopeUp = state.GET_BOOL();
        this.pulse2_volumeEnvelopeSweep = state.GET_8();
        this.pulse2_volumeEnvelopeStart = state.GET_8();
        this.pulse2_outputLeft = state.GET_BOOL();
        this.pulse2_outputRight = state.GET_BOOL();

        this.wave_enabled = state.GET_BOOL();
        this.wave_dacEnabled = state.GET_BOOL();
        this.wave_lengthEnable = state.GET_BOOL();
        this.wave_lengthCounter = state.GET_8();
        this.wave_frequencyUpper = state.GET_8();
        this.wave_frequencyLower = state.GET_8();
        this.wave_volume = state.GET_8();
        this.wave_oldVolume = state.GET_8();
        this.wave_waveTable = state.GET_8ARRAY(32);
        this.wave_waveTableUpdated = state.GET_BOOL();
        this.wave_outputLeft = state.GET_BOOL();
        this.wave_outputRight = state.GET_BOOL();

        this.noise_enabled = state.GET_BOOL();
        this.noise_divisorCode = state.GET_8();
        this.noise_lengthEnable = state.GET_BOOL();
        this.noise_lengthCounter = state.GET_8();
        this.noise_dacEnabled = state.GET_BOOL();
        this.noise_volume = state.GET_8();
        this.noise_volumeEnvelopeUp = state.GET_BOOL();
        this.noise_volumeEnvelopeSweep = state.GET_8();
        this.noise_volumeEnvelopeStart = state.GET_8();
        this.noise_outputLeft = state.GET_BOOL();
        this.noise_outputRight = state.GET_BOOL();
        this.noise_shiftClockFrequency = state.GET_8();
        this.noise_counterStep = state.GET_BOOL();
        this.noise_envelopeSweep = state.GET_8();

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

        this.vinLeftEnable = state.GET_BOOL();
        this.vinRightEnable = state.GET_BOOL();
        this.leftMasterVol = state.GET_8();
        this.rightMasterVol = state.GET_8();

        this.leftMasterVolMul = state.GET_8();
        this.rightMasterVolMul = state.GET_8();

        this.pulse1Val = state.GET_8();
        this.pulse2Val = state.GET_8();
        this.waveVal = state.GET_8();
        this.noiseVal = state.GET_8();

        if (this.ap) {
            this.ap.noise(this);
            this.ap.pulse1(this);
            this.ap.pulse2(this);
            this.ap.updateWaveTable(this);
        }
    }
}