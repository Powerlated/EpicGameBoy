export interface BasicChannel {
    triggered: boolean;
    volume: number;
    enabled: boolean;

    updated: boolean;
    update(): void;
}

export class PulseChannel implements BasicChannel {
    enabled: boolean = false;

    width: number = 2;

    lengthEnable: boolean = false;
    lengthCounter: number = 0;

    frequencyUpper: number = 0; // Frequency = 131072/(2048-x) Hz
    frequencyLower: number = 0;
    oldFrequencyLower: number = 0;
    oldFrequencyHz: number = 0;

    volume: number = 0; // 4-bit value 0-15
    volumeEnvelopeUp: boolean = false;
    volumeEnvelopeSweep: number = 4;
    volumeEnvelopeStart: number = 0;

    oldVolume: number = 0;

    outputLeft: boolean = false;
    outputRight: boolean = false;

    triggered: boolean = false;
    freqSweepTime: number = 0;
    freqSweepUp: boolean = false;
    freqSweepShiftNum: number = 0;

    get outputting(): boolean {
        return (this.outputLeft || this.outputRight) && this.frequencyHz != 64;
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
        let frequency: number = (this.frequencyUpper << 8) | this.frequencyLower;
        return 131072 / (2048 - frequency);
    }

    trigger(): void {
        this.enabled = true;
        if (this.lengthCounter == 0) {
            this.lengthCounter = 64;
        }
        this.volume = this.volumeEnvelopeStart;
    }

    updated: boolean = false;
    update(): void { this.updated = true; };
}

export class WaveChannel implements BasicChannel {
    enabled: boolean = false;

    lengthEnable: boolean = true;
    lengthCounter: number = 0;

    frequencyUpper: number = 0;
    frequencyLower: number = 0;
    oldFrequencyHz: number = 0;

    volume: number = 0;
    oldVolume: number = 0;

    waveTable: Array<number> = new Array(32).fill(0);
    waveTableUpdated: boolean = false;

    restartSound: boolean = false;


    outputLeft: boolean = false;
    outputRight: boolean = false;

    triggered: boolean = false;

    get outputting(): boolean {
        return (this.outputLeft || this.outputRight) && this.frequencyHz != 64;
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
        let frequency: number = (this.frequencyUpper << 8) | this.frequencyLower;
        return (65536 / (2048 - frequency));
    }

    trigger(): void {
        this.enabled = true;
        if (this.lengthCounter == 0) {
            this.lengthCounter = 256;
        }
    }

    updated: boolean = false;
    update(): void { this.updated = true; };
}

export class NoiseChannel implements BasicChannel {
    enabled: boolean = false;

    lengthEnable: boolean = false;
    lengthCounter: number = 0;

    volume: number = 0; // 4-bit value 0-15
    volumeEnvelopeUp: boolean = false;
    volumeEnvelopeSweep: number = 4;
    volumeEnvelopeStart: number = 0;

    outputLeft: boolean = false;
    outputRight: boolean = false;

    triggered: boolean = false;

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

    trigger(): void {
        this.enabled = true;
    }

    updated: boolean = false;
    update(): void { this.updated = true; };
}