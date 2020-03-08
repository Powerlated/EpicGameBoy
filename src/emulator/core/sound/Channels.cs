namespace DMSharp
{
    class PulseChannel
    {
        public bool enabled = false;

        public int width = 2;

        public bool lengthEnable = false;
        public int lengthCounter = 0;

        public int frequencyUpper = 0; // Frequency = 131072/(2048-x) Hz
        public int frequencyLower = 0;
        public int oldFrequencyLower = 0;
        public int oldFrequencyHz = 0;

        public int volume = 0; // 4-bit value 0-15
        public bool volumeEnvelopeUp = false;
        public int volumeEnvelopeSweep = 4;
        public int volumeEnvelopeStart = 0;

        public int oldVolume = 0;

        public bool outputLeft = false;
        public bool outputRight = false;

        public bool triggered = false;
        public int freqSweepTime = 0;
        public bool freqSweepUp = false;
        public int freqSweepShiftNum = 0;

        public bool outputting
        {
            get
            {
                return (this.outputLeft || this.outputRight) && this.frequencyHz != 64;
            }
        }

        public double pan
        {
            get
            {

                if (this.outputLeft && !this.outputRight)
                {
                    return -0.5;
                }
                if (this.outputRight && !this.outputLeft)
                {
                    return 0.5;
                }
                if (this.outputLeft && this.outputRight)
                {
                    return 0;
                }
                return 0;
            }
        }

        public int frequencyHz
        {
            get
            {
                var frequency = (this.frequencyUpper << 8) | this.frequencyLower;
                return 131072 / (2048 - frequency);
            }
        }

        public void Trigger()
        {
            this.enabled = true;
            if (this.lengthCounter == 0)
            {
                this.lengthCounter = 64;
            }
            this.volume = this.volumeEnvelopeStart;
            this.Update();
        }

        public bool updated = false;
        public void Update() { this.updated = true; }
    }

    class WaveChannel
    {
        public bool enabled = false;

        public bool lengthEnable = true;
        public int lengthCounter = 0;

        public int frequencyUpper = 0;
        public int frequencyLower = 0;
        public int oldFrequencyHz = 0;

        public int volume = 0;
        public int oldVolume = 0;

        public bool playing = true;

        public byte[] waveTable = new byte[32];
        public bool waveTableUpdated = false;

        public bool restartSound = false;


        public bool outputLeft = false;
        public bool outputRight = false;

        public bool triggered = false;

        public bool outputting
        {
            get
            {
                return (this.outputLeft || this.outputRight) && this.frequencyHz != 64;
            }
        }

        public double pan
        {
            get
            {
                if (this.outputLeft && !this.outputRight)
                {
                    return -0.5;
                }
                if (this.outputRight && !this.outputLeft)
                {
                    return 0.5;
                }
                if (this.outputLeft && this.outputRight)
                {
                    return 0;
                }
                return 0;
            }
        }

        public int frequencyHz
        {
            get
            {
                var frequency = (this.frequencyUpper << 8) | this.frequencyLower;
                return (65536 / (2048 - frequency));
            }
        }

        public void Trigger()
        {
            this.enabled = true;
            if (this.lengthCounter == 0)
            {
                this.lengthCounter = 256;
            }
            this.Update();
        }

        public bool updated = false;
        public void Update()
        {
            this.updated = true;
        }
    }

    class NoiseChannel
    {
        public bool enabled = false;

        public bool lengthEnable = false;
        public int lengthCounter = 0;

        public int volume = 0;
        public bool volumeEnvelopeUp = false;
        public int volumeEnvelopeSweep = 4;
        public int volumeEnvelopeStart = 0;

        public bool outputLeft = false;
        public bool outputRight = false;

        public bool triggered = false;
        public int shiftClockFrequency = 0;
        public bool counterStep = false;
        public int envelopeSweep = 0;

        public bool outputting
        {
            get
            {
                return this.outputLeft || this.outputRight;
            }
        }

        public double pan
        {
            get
            {
                if (this.outputLeft && !this.outputRight)
                {
                    return -0.5;
                }
                if (this.outputRight && !this.outputLeft)
                {
                    return 0.5;
                }
                if (this.outputLeft && this.outputRight)
                {
                    return 0;
                }
                return 0;
            }
        }

        public double[] buffer
        {
            get
            {
                var seed = 0xFC;
                var period = 0;

                int lfsr(int p)
                {
                    if (period > p)
                    {
                        var b0 = ((seed >> 0) & 1);
                        var b1 = ((seed >> 2) & 1);

                        seed >>= 1;

                        var xor = b0 ^ b1;

                        seed |= xor << 14;

                        period = 0;
                    }
                    period++;

                    return seed;
                }
                return new double[64];
            }
        }

        public void Trigger()
        {
            this.enabled = true;
            this.Update();
        }

        public bool updated = false;
        public void Update() { this.updated = true; }
    }
}