export interface BasicChannel {
    volume: number;
    enabled: boolean;
    updated: boolean;
}

export class PulseChannel implements BasicChannel {
    enabled = false;

    width = 3;
    dacEnabled = false;

    lengthEnable = false;
    lengthCounter = 0;

    frequencyUpper = 0; // Frequency = 131072/(2048-x) Hz
    frequencyLower = 0;
    
    volume = 0; // 4-bit value 0-15
    volumeEnvelopeUp = false;
    volumeEnvelopeSweep = 4;
    volumeEnvelopeStart = 0;

    oldVolume = 0;

    outputLeft = false;
    outputRight = false;

    freqSweepPeriod = 0;
    freqSweepUp = false;
    
    freqSweepShift = 0;
    updated = false;

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
        this.updated = true;
    }
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
    waveTableUpdated = true;

    restartSound = false;

    outputLeft = false;
    outputRight = false;

    updated = false;

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

    trigger() {
        if (this.lengthCounter === 0 || this.lengthEnable == false) {
            this.lengthCounter = 256;
        }
        if (this.dacEnabled) {
            this.enabled = true;
        }
        this.updated = true;
    }
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

    shiftClockFrequency = 0;
    counterStep = false;
    envelopeSweep = 0;

    updated = false;

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

    trigger() {
        if (this.dacEnabled)
            this.enabled = true;
        if (this.lengthCounter === 0 || this.lengthEnable == false) {
            this.lengthCounter = 64;
        }
        this.volume = this.volumeEnvelopeStart;
        this.updated = true;
    }
}