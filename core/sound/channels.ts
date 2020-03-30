import * as Tone from "tone";

export interface BasicChannel {
    triggered: boolean;
    volume: number;
    enabled: boolean;

    updated: boolean;
    update(): void;
}

export class PulseChannel implements BasicChannel {
    enabled = false;

    width = 3;
    dacEnabled = false;

    lengthEnable = false;
    lengthCounter = 0;

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

    triggered = false;
    freqSweepTime = 0;
    freqSweepUp = false;
    freqSweepShiftNum = 0;

    get outputting(): boolean {
        return (this.outputLeft || this.outputRight) && this.frequencyHz !== 64;
    }

    get pan(): number {
        if (this.outputLeft && !this.outputRight) {
            return 0.5;
        }
        if (this.outputRight && !this.outputLeft) {
            return -0.5;
        }
        if (this.outputLeft && this.outputRight) {
            return 0;
        }
        return 0;
    }

    get frequencyHz(): number {
        const frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return 131072 / (2048 - frequency);
    }

    trigger() {
        if (this.lengthCounter === 0 || this.lengthEnable == false) {
            this.lengthCounter = 64;
        }
        this.volume = this.volumeEnvelopeStart;
        if (this.dacEnabled) {
            this.enabled = true;
        }
        this.update();
    }

    updated = false;
    update() { this.updated = true; };
}

export class WaveChannel implements BasicChannel {
    enabled = false;

    dacEnabled = false;

    lengthEnable = true;
    lengthCounter = 0;

    frequencyUpper = 0;
    frequencyLower = 0;
    oldFrequencyHz = 0;

    volume = 0;
    oldVolume = 0;

    waveTable: Array<number> = [0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF];
    waveTableUpdated = false;

    restartSound = false;


    outputLeft = false;
    outputRight = false;

    triggered = false;

    get outputting(): boolean {
        return (this.outputLeft || this.outputRight) && this.frequencyHz !== 64;
    }

    get pan(): number {
        if (this.outputLeft && !this.outputRight) {
            return -0.5;
        }
        if (this.outputRight && !this.outputLeft) {
            return 0.5;
        }
        if (this.outputLeft && this.outputRight) {
            return 0;
        }
        return 0;
    }

    get frequencyHz(): number {
        const frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return 65536 / (2048 - frequency);
    }

    get buffer(): AudioBuffer {
        let sampleRate = 112640; // A440 without any division
        if (sampleRate > 384000) {
            sampleRate = 112640; // Back to A440 if invalid vale in BaseAudioContext.createBuffer()
        }

        let waveTable = this.waveTable.map(v => (v - 8) / 4).flatMap(i => [i, i, i, i, i, i, i, i, i, i, i, i, i, i, i, i]);

        // Output all zeroes if frequency binary is zero
        if (this.frequencyHz === 32) {
            waveTable = new Array(1).fill(0);
        }

        const ac = (Tone.context as any as AudioContext);
        const arrayBuffer = ac.createBuffer(1, waveTable.length, sampleRate);
        const buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    trigger() {
        if (this.lengthCounter === 0 || this.lengthEnable == false) {
            this.lengthCounter = 256;
        }
        if (this.dacEnabled) {
            this.enabled = true;
        }
        this.update();
    }

    updated = false;
    update() {
        this.updated = true;
    };
}

export class NoiseChannel implements BasicChannel {
    enabled = false;

    divisorCode = 0;

    lengthEnable = false;
    lengthCounter = 0;

    dacEnabled = false;

    volume = 0;
    volumeEnvelopeUp = false;
    volumeEnvelopeSweep = 4;
    volumeEnvelopeStart = 0;

    outputLeft = false;
    outputRight = false;

    triggered = false;
    shiftClockFrequency = 0;
    counterStep = false;
    envelopeSweep = 0;

    get outputting(): boolean {
        return this.outputLeft || this.outputRight;
    }

    get pan(): number {
        if (this.outputLeft && !this.outputRight) {
            return -0.5;
        }
        if (this.outputRight && !this.outputLeft) {
            return 0.5;
        }
        if (this.outputLeft && this.outputRight) {
            return 0;
        }
        return 0;
    }

    buffer(sevenBit: boolean): AudioBuffer {
        let capacitor = 0.0;

        function high_pass(inValue: number): number {
            let out = 0.0;
            out = inValue - capacitor;

            // capacitor slowly charges to 'in' via their difference
            capacitor = inValue - out * 0.9; // use 0.998943 for MGB&CGB
            return out;
        }

        let seed = 0xFF;
        let period = 0;

        function lfsr(p: number) {
            let bit = (seed >> 1) ^ (seed >> 2);
            bit &= 1;
            if (period > p) {
                seed = (seed >> 1) | (bit << 14);

                if (sevenBit == true) {
                    seed &= ~(1 << 6);
                    seed |= (bit << 6);
                }

                period = 0;
            }
            period++;

            return seed & 1;
        }

        let LFSR_MUL = 16;

        let waveTable = new Array(32768 * LFSR_MUL).fill(0);
        // TODO: Hook LFSR into the rest of the sound chip
        waveTable = waveTable.map((v, i) => {
            let bit = lfsr(LFSR_MUL);
            let out;
            if (bit == 1) {
                out = 1;
            } else {
                out = -1;
            }
            return out;
        });



        // waveTable = waveTable.map((v, i) => {
        // return Math.round(Math.random());
        // });

        // waveTable = waveTable.reduce(function (m, i) { return (m as any).concat(new Array(4).fill(i)); }, []);

        const ac = (Tone.context as any as AudioContext);
        const arrayBuffer = ac.createBuffer(1, waveTable.length, 48000);
        const buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    trigger() {
        if (this.dacEnabled)
            this.enabled = true;
        if (this.lengthCounter === 0 || this.lengthEnable == false) {
            this.lengthCounter = 64;
        }
        this.volume = this.volumeEnvelopeStart;
        this.update();
    }

    updated = false;
    update() { this.updated = true; };
}