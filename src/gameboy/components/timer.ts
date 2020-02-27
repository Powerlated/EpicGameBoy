import GameBoy from "../gameboy";

export default class Timer {
    static TimerSpeeds: number[] = [64, 1, 4, 16]; // In terms of 262144hz division 

    gb: GameBoy;

    divider: number = 0;
    counter: number = 0;
    modulo: number = 0;
    control = {
        speed: 0,
        running: false
    };

    c = {
        clock: 0,
        divClock: 0,
        mainClock: 0
    };

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    step(): void {
        // Get the mtime
        this.c.clock += this.gb.cpu.lastInstructionCycles / 4;

        // 1048576hz Divide by 4 = 262144hz
        if (this.c.clock >= 4) {
            this.c.mainClock++;
            this.c.clock -= 4;

            this.c.divClock++;
            // Divide by 16 again for 16834hz div clock
            if (this.c.divClock == 16) {
                this.divider++;
                this.divider &= 0xFF;
                this.c.divClock = 0;
            }
        }

        if (this.control.running) {
            if (this.counter == this.modulo) this.gb.bus.interrupts.requestTimer();

            if (this.c.mainClock >= Timer.TimerSpeeds[this.control.speed]) {
                this.counter++;
            }

            if (this.counter >= 256) {
                this.counter = this.modulo;
            }
        }
    }

    reset(): void {
        this.divider = 0;
        this.counter = 0;
        this.modulo = 0;

        this.control.speed = 0;
        this.control.running = false;

        this.c.clock = 0;
        this.c.divClock = 0;
        this.c.mainClock = 0;
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
        let n: number = 0;

        n |= (this.control.speed & 0b11); // Bits 0-1
        if (this.control.running) n |= 0b00000100; // Bit 2

        return n;
    }
    set addr_0xFF07(i: number) {
        this.control.speed = i & 0b11; // Bits 0-1
        this.control.running = (i >> 2) != 0; // Bit 2
    }
}