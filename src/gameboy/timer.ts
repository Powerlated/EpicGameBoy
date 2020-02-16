class Timer {
    static TimerSpeeds = [64, 1, 4, 16]; // In terms of 262144hz division 

    gb: GameBoy;

    divider = 0;
    counter = 0;
    modulo = 0;
    control = {
        speed: 0,
        running: false
    };

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    step() {
        let time = this.gb.cpu.cycles / 4;
        const BASE = 16;


        // 4194304 Divide by 16 = 262144hz
        if (time % BASE == 0) {
            // Divide by 16 again = 16384hz 
            if (time % (BASE * 16) == 0) {
                this.divider++;
                this.divider &= 0xFF;
            }

            if (time % (BASE * Timer.TimerSpeeds[this.control.speed]) == 0) {
                this.counter++;
                if (this.counter >= 256) {
                    this.gb.bus.interrupts.requestTimer();
                    this.counter = this.modulo;
                }
            }
        }
    }

    // Divider
    get addr_0xFF04(): number {
        return this.divider;
    }
    set addr_0xFF04(i: number) {
        // Resets to 0 when written to
        this.divider = 0;
    }

    // Counter
    get addr_0xFF05(): number {
        return this.counter;
    }
    set addr_0xFF05(i: number) {
        this.counter = i;
    }

    // Modulo
    get addr_0xFF06(): number {
        return this.modulo;
    }
    set addr_0xFF06(i: number) {
        this.modulo = i;
    }

    // Control
    get addr_0xFF07(): number {
        let n = 0;

        n |= (this.control.speed & 0b11); // Bits 0-1
        if (this.control.running) n |= 0b00000100; // Bit 2

        return n;
    }
    set addr_0xFF07(i: number) {
        this.control.speed = i & 0b11; // Bits 0-1
        this.control.running = (i >> 2) != 0; // Bit 2
    }
}