import GameBoy from "../gameboy";
import { hex } from "../../src/gameboy/tools/util";
import { HWIO } from "../memory/hwio";


export default class Timer implements HWIO {

    static TimerSpeeds = [1024, 16, 64, 256]; // In terms of 4194304hz division 


    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    gb: GameBoy;

    counter = 0; // TIMA
    modulo = 0;
    control = {
        speed: 0,
        running: false
    };

    internal = 0;
    mainClock = 0;

    cyclesBehind = 0;

    readHwio(addr: number): number | null {
        switch (addr) {
            case 0xFF04: // Timer divider
                return this.internal >> 8;
            case 0xFF05: // Timer counter
                return this.counter;
            case 0xFF06: // Timer modulo
                return this.modulo;
            case 0xFF07: // Timer control
                let n = 0;

                n |= (this.control.speed & 0b11); // Bits 0-1
                if (this.control.running) n |= 0b00000100; // Bit 2

                return n;
        }
        return null;
    }
    writeHwio(addr: number, value: number): void {
        switch (addr) {
            case 0xFF04: // Timer divider
                this.mainClock = 0;
                this.internal = 0;
                break;
            case 0xFF05: // Timer counter
                break;
            case 0xFF06: // Timer modulo
                this.modulo = value;
                break;
            case 0xFF07: // Timer control
                this.control.speed = value & 0b11; // Bits 0-1
                this.control.running = (value >> 2) !== 0; // Bit 2
                this.mainClock = 0;
                break;
        }
    }

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
}