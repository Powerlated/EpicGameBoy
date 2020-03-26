import GameBoy from "../gameboy";
import { hex } from "../../src/gameboy/tools/util";

export default class Timer {
    static TimerSpeeds = [1024, 16, 64, 256]; // In terms of 4194304hz division 

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

    cyclesBehind = 0;

    /**
     * DIV has a lower byte that increments every T-cycle.
     * 
     * When counter (TIMA) overflows, it stays 0x00 for a full M-cycle before
     * firing the interrupt and reloading with modulo. 
     */
    step() {
        this.cyclesBehind += this.gb.cpu.lastInstructionCycles;

        if (this.gb.interrupts.enabledInterrupts.timer) {
            this.catchup();
        }
    }

    catchup() {
        // Get the mtime
        this.c.internal += this.cyclesBehind;
        while (this.c.internal >= 256) {
            this.divider++;
            this.divider &= 0xFF;
            this.c.internal -= 256;
        }

        this.c.mainClock += this.cyclesBehind;
        while (this.c.mainClock >= Timer.TimerSpeeds[this.control.speed]) {
            if (this.control.running && this.counterOverflowTtime === 0) {
                this.counter++;
            }
            this.c.mainClock -= Timer.TimerSpeeds[this.control.speed];
        }

        while (this.counter >= 256) {
            this.counterOverflowTtime = 4;
            this.counter -= 256;
        }

        if (this.counterOverflowTtime > 0) {
            if (this.counterOverflowTtime === 1) {
                this.counter = this.modulo;
                this.gb.interrupts.requestTimer();
            }
            this.counterOverflowTtime--;
        }

        this.cyclesBehind = 0;
    }

    reset() {
        this.divider = 0;
        this.counter = 0;
        this.modulo = 0;

        this.control.speed = 0;
        this.control.running = false;

        this.c.mainClock = 0;
        this.c.internal = 0;
        this.counterOverflowTtime = 0;

        this.cyclesBehind = 0;
    }

    // Divider
    get addr_0xFF04(): number {
        this.catchup();
        return this.divider;
    }
    set addr_0xFF04(i: number) {
        // Resets to 0 when written to
        this.catchup();
        this.c.mainClock = 0;
        this.c.internal = 0;
        this.divider = 0;
        this.counterOverflowTtime = 0;
    }

    // Counter / TIMA
    get addr_0xFF05(): number {
        this.catchup();
        return this.counter;
    }
    set addr_0xFF05(i: number) {
        this.catchup();
        if (this.counterOverflowTtime === 0)
            this.counter = i;
    }

    // Modulo
    get addr_0xFF06(): number {
        this.catchup();
        return this.modulo;
    }
    set addr_0xFF06(i: number) {
        this.catchup();
        this.modulo = i;
    }

    // Control
    get addr_0xFF07(): number {
        this.catchup();
        let n = 0;

        n |= (this.control.speed & 0b11); // Bits 0-1
        if (this.control.running) n |= 0b00000100; // Bit 2

        return n;
    }
    set addr_0xFF07(i: number) {
        this.catchup();
        this.control.speed = i & 0b11; // Bits 0-1
        this.control.running = (i >> 2) !== 0; // Bit 2
        this.c.mainClock = 0;
    }
}