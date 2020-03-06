import GameBoy from "../../gameboy";
import { hex } from "../../tools/util";

export default class Timer {
    static TimerSpeeds = [1024, 16, 64, 256]; // In terms of 262144hz division 

    gb: GameBoy;

    divider = 0;
    counter = 0; // TIMA
    modulo = 0;
    control = {
        speed: 0,
        running: false
    };

    counterOverflowTtime = 4;

    c = {
        internal: 0,
        mainClock: 0
    };

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    /**
     * DIV has a lower byte that increments every T-cycle.
     * 
     * When counter (TIMA) overflows, it stays 0x00 for a full M-cycle before
     * firing the interrupt and reloading with modulo. 
     */
    step() {
        // Get the mtime
        const BASE = 16;

        for (let i = 0; i < this.gb.cpu.lastInstructionCycles; i++) {
            this.c.internal++;
            if (this.c.internal >= 256) {
                this.divider++;
                this.divider &= 0xFF;
                this.c.internal = 0;
            }

            this.c.mainClock++; this.c.mainClock &= 0xFFFF;
            if (this.c.mainClock % Timer.TimerSpeeds[this.control.speed] == 0) {
                if (this.control.running && this.counterOverflowTtime == 0) {
                    this.counter++;
                }
            }

            if (this.counter >= 256) {
                this.counterOverflowTtime = 4;
                this.counter = 0;
            }

            if (this.counterOverflowTtime > 0) {
                if (this.counterOverflowTtime == 1) {
                    console.log("Reloading TIMA");
                    this.counter = this.modulo;
                    this.gb.bus.interrupts.requestTimer();
                }
                this.counterOverflowTtime--;
            }
        }
    }

    reset() {
        this.divider = 0;
        this.counter = 0;
        this.modulo = 0;

        this.control.speed = 0;
        this.control.running = false;

        this.c.mainClock = 0;
    }

    // Divider
    get addr_0xFF04(): number {
        return this.divider;
    }
    set addr_0xFF04(i: number) {
        // Resets to 0 when written to
        this.c.mainClock = 0;
        this.c.internal = 0;
        this.divider = 0;
        this.counterOverflowTtime = 0;
    }

    // Counter / TIMA
    get addr_0xFF05(): number {
        console.log(`PC: ${hex(this.gb.cpu.pc, 4)} Read from 0xFF05 TIMA: ${this.counter}`);
        return this.counter;
    }
    set addr_0xFF05(i: number) {
        if (this.counterOverflowTtime == 0)
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