import GameBoy from "../gameboy";
import { hex } from "../../src/gameboy/tools/util";
import { HWIO } from "../memory/hwio";


export default class Timer implements HWIO {

    static TimerSpeeds = [4096, 262144, 65536, 16384]; // In terms of HZ 


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

    previous = false;

    queueReload = false;

    readHwio(addr: number): number {
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
        return 0xFF;
    }
    writeHwio(addr: number, value: number): void {
        switch (addr) {
            case 0xFF04: // Timer divider - DIV
                this.internal = 0;
                break;
            case 0xFF05: // Timer counter - TIMA
                this.counter = value;
                this.queueReload = false;
                break; 
            case 0xFF06: // Timer modulo - TMA
                this.modulo = value;
                break;
            case 0xFF07: // Timer control - TAC
                this.control.speed = value & 0b11; // Bits 0-1
                this.control.running = (value >> 2) !== 0; // Bit 2
                break;
        }
    }

    /**
     * DIV has a lower byte that increments every T-cycle.
     * 
     * When counter (TIMA) overflows, it stays 0x00 for a full M-cycle before
     * firing the interrupt and reloading with modulo. 
     */
    tick(cycles: number) {
        while (cycles > 0) {
            // if (cycles >= 8) {
            //     cycles -= 8;
            //     this.internal += 8;
            // } else {
            cycles -= 4;
            this.internal += 4;
            // }
            this.internal &= 0xFFFF;

            if (this.queueReload === true) {
                this.queueReload = false;

                this.counter = this.modulo;
                this.gb.interrupts.requested.timer = true;
            }

            let now: boolean;

            switch (this.control.speed) {
                case 1:
                    now = (this.internal & (1 << 3)) !== 0;
                    break;
                case 2:
                    now = (this.internal & (1 << 5)) !== 0;
                    break;
                case 3:
                    now = (this.internal & (1 << 7)) !== 0;
                    break;
                default:
                case 0:
                    now = (this.internal & (1 << 9)) !== 0;
                    break;
            }

            const condition = this.control.running && now;
            if (condition === false && this.previous === true) {
                this.counter++;
                if (this.counter > 255) {
                    this.counter = 0;
                    this.queueReload = true;
                }
            }
            this.previous = condition;
        }
    }

    reset() {
        this.counter = 0;
        this.modulo = 0;

        this.control.speed = 0;
        this.control.running = false;

        this.internal = 0;

        this.queueReload = false;
        this.previous = false;

    }
}