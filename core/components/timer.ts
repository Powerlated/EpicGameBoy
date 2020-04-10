import GameBoy from "../gameboy";
import { hex } from "../../src/gameboy/tools/util";
import { HWIO } from "../memory/hwio";

export default class Timer implements HWIO {
    static TimerSpeeds = [1024, 16, 64, 256]; // In terms of 4194304hz division 

    gb: GameBoy;

    counter = 0; // TIMA
    modulo = 0;
    control = {
        speed: 0,
        running: false
    };

    internal = 0;
    mainClock = 0;


    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    readHwio(addr: number): number | null {
        switch (addr) {
            case 0xFF04: // Timer divider
                return this.addr_0xFF04;
            case 0xFF05: // Timer counter
                return this.addr_0xFF05;
            case 0xFF06: // Timer modulo
                return this.addr_0xFF06;
            case 0xFF07: // Timer control
                return this.addr_0xFF07 | 0b11111000;
        }
        return null;
    }
    writeHwio(addr: number, value: number): void {
        switch (addr) {
            case 0xFF04: // Timer divider
                this.addr_0xFF04 = value;
                break;
            case 0xFF05: // Timer counter
                this.addr_0xFF05 = value;
                break;
            case 0xFF06: // Timer modulo
                this.addr_0xFF06 = value;
                break;
            case 0xFF07: // Timer control
                this.addr_0xFF07 = value;
                break;
        }
    }

    cyclesBehind = 0;

    /**
     * DIV has a lower byte that increments every T-cycle.
     * 
     * When counter (TIMA) overflows, it stays 0x00 for a full M-cycle before
     * firing the interrupt and reloading with modulo. 
     */
    step(cycles: number) {
        this.cyclesBehind += cycles;

        if (this.gb.interrupts.enabled.timer) {
            this.catchup();
        }
    }

    catchup() {
        // Get the mtime
        this.internal += this.cyclesBehind;
        this.internal &= 0xFFFF;

        this.mainClock += this.cyclesBehind;

        while (this.mainClock >= Timer.TimerSpeeds[this.control.speed]) {
            if (this.control.running) {
                this.counter++;
            }
            this.mainClock -= Timer.TimerSpeeds[this.control.speed];
        }

        while (this.counter >= 256) {
            this.counter = this.modulo;
            this.gb.interrupts.requested.timer = true;
        }
        this.cyclesBehind = 0;
    }

    reset() {
        this.counter = 0;
        this.modulo = 0;

        this.control.speed = 0;
        this.control.running = false;

        this.mainClock = 0;
        this.internal = 0;

        this.cyclesBehind = 0;
    }

    // Divider
    get addr_0xFF04(): number {
        this.catchup();
        return this.internal >> 8;
    }
    set addr_0xFF04(i: number) {
        // Resets to 0 when written to
        this.catchup();
        this.mainClock = 0;
        this.internal = 0;
    }

    // Counter / TIMA
    get addr_0xFF05(): number {
        this.catchup();
        return this.counter;
    }
    set addr_0xFF05(i: number) {
        this.catchup();
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
        this.mainClock = 0;
    }
}