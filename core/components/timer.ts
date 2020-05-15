import GameBoy from "../gameboy";
import { hex } from "../../src/gameboy/tools/util";
import { HWIO } from "../memory/hwio";
import { BIT_12, BIT_13, BIT_5, BIT_3, BIT_7, BIT_9 } from "../bit_constants";
import { Serializer } from "../serialize";

const TIMER_BITS = Uint16Array.of(BIT_9, BIT_3, BIT_5, BIT_7);

export default class Timer implements HWIO {

    static TimerSpeeds = [4096, 262144, 65536, 16384]; // In terms of HZ 

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    gb: GameBoy;

    counter = 0; // TIMA
    modulo = 0;
    speed = 0;
    running = false;

    internal = 0;

    previousTimerCondition = false;
    previousFrameSequencerCondition = false;

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
                let n = 0b11111000;

                n |= (this.speed & 0b11); // Bits 0-1
                if (this.running) n |= 0b00000100; // Bit 2

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
                this.speed = value & 0b11; // Bits 0-1
                this.running = (value >> 2) !== 0; // Bit 2
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
            if (cycles >= 8) {
                cycles -= 8;
                this.internal += 8;
            } else {
                cycles -= 4;
                this.internal += 4;
            }
            this.internal &= 0xFFFF;

            if (this.queueReload === true) {
                this.queueReload = false;

                this.counter = this.modulo;
                this.gb.cpu.if.timer = true;
            }

            const timerCondition = this.running && (this.internal & TIMER_BITS[this.speed]) !== 0;
            if (timerCondition === false && this.previousTimerCondition === true) {
                this.counter++;
                if (this.counter > 255) {
                    this.counter = 0;
                    this.queueReload = true;
                }
            }
            this.previousTimerCondition = timerCondition;
        }

        const mask = BIT_12 << this.gb.doubleSpeedShift;
        const frameSequencerCondition = (this.internal & mask) !== 0;
        if (frameSequencerCondition === false && this.previousFrameSequencerCondition === true) {
            this.gb.soundChip.advanceFrameSequencer();
        }

        this.previousFrameSequencerCondition = frameSequencerCondition;
    }

    reset() {
        this.counter = 0;
        this.modulo = 0;
        this.speed = 0;
        this.running = false;

        this.internal = 0;

        this.previousTimerCondition = false;
        this.previousFrameSequencerCondition = false;

        this.queueReload = false;
    }

    serialize(state: Serializer) {
        state.PUT_8(this.counter);
        state.PUT_8(this.modulo);
        state.PUT_8(this.speed);
        state.PUT_BOOL(this.running);

        state.PUT_16LE(this.internal);

        state.PUT_BOOL(this.previousTimerCondition);
        state.PUT_BOOL(this.previousFrameSequencerCondition);

        state.PUT_BOOL(this.queueReload);
    }

    deserialize(state: Serializer) {
        this.counter = state.GET_8()
        this.modulo = state.GET_8()
        this.speed = state.GET_8()
        this.running = state.GET_BOOL()

        this.internal = state.GET_16LE()

        this.previousTimerCondition = state.GET_BOOL()
        this.previousFrameSequencerCondition = state.GET_BOOL()

        this.queueReload = state.GET_BOOL()
    }
}