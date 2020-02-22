interface BasicChannel {
    triggered: boolean;
    volume: number;
    enabled: boolean;
}

class PulseChannel implements BasicChannel {
    enabled = false;

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
        let frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return 131072 / (2048 - frequency);
    }

    trigger() {
        this.enabled = true;
        if (this.lengthCounter == 0) {
            this.lengthCounter = 64;
        }
        this.volume = this.volumeEnvelopeStart;
    }
}

class WaveChannel implements BasicChannel {
    enabled = false;

    lengthEnable = true;
    lengthCounter = 0;

    frequencyUpper = 0;
    frequencyLower = 0;
    oldFrequencyHz = 0;

    volume = 0;
    oldVolume = 0;

    waveTable: Array<number> = new Array(32).fill(0);
    waveTableUpdated = false;

    restartSound = false;


    outputLeft = false;
    outputRight = false;

    triggered = false;

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
        let frequency = (this.frequencyUpper << 8) | this.frequencyLower;
        return (65536 / (2048 - frequency));
    }

    get buffer(): AudioBuffer {
        let sampleRate = 56320 * (this.frequencyHz / 440); // A440 without any division
        if (sampleRate > 384000) {
            sampleRate = 56320; // Back to A440 if invalid vale in BaseAudioContext.createBuffer()
        }

        let waveTable = this.waveTable.map(v => { return (v - 8) / 8; });
        waveTable = waveTable.reduce(function (m, i) { return (m as any).concat(new Array(4).fill(i)); }, []);

        // Output all zeroes if frequency binary is zero
        if (this.frequencyHz == 32) {
            waveTable = new Array(1).fill(0);
        }

        let ac = (Tone.context as any as AudioContext);
        let arrayBuffer = ac.createBuffer(1, waveTable.length, sampleRate);
        let buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    trigger() {
        this.enabled = true;
        if (this.lengthCounter == 0) {
            this.lengthCounter = 256;
        }
    }
}

class NoiseChannel implements BasicChannel {
    enabled = false;

    lengthEnable = false;
    lengthCounter = 0;

    volume = 0; // 4-bit value 0-15
    volumeEnvelopeUp = false;
    volumeEnvelopeSweep = 4;
    volumeEnvelopeStart = 0;

    outputLeft = false;
    outputRight = false;

    triggered = false;

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

    get buffer(): AudioBuffer {
        let waveTable = new Array(4800).fill(0);
        waveTable = waveTable.map((v, i) => {
            return Math.round(Math.random());
        });

        // waveTable = waveTable.reduce(function (m, i) { return (m as any).concat(new Array(4).fill(i)); }, []);

        let ac = (Tone.context as any as AudioContext);
        let arrayBuffer = ac.createBuffer(1, waveTable.length, 48000);
        let buffering = arrayBuffer.getChannelData(0);
        for (let i = 0; i < arrayBuffer.length; i++) {
            buffering[i] = waveTable[i % waveTable.length];
        }

        return arrayBuffer;
    }

    trigger() {
        console.log("triggered noise")
        this.enabled = true;
    }
}