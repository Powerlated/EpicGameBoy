import MemoryBus from "../core/memorybus";


export class InterruptFlag {
    vblank: boolean = false;
    lcdStat: boolean = false;
    timer: boolean = false;
    serial: boolean = false;
    joypad: boolean = false;


    set numerical(i: number) {
        this.vblank = (i & (1 << 0)) != 0;
        this.lcdStat = (i & (1 << 1)) != 0;
        this.timer = (i & (1 << 2)) != 0;
        this.serial = (i & (1 << 3)) != 0;
        this.joypad = (i & (1 << 4)) != 0;
        return;
    }

    get numerical(): number {
        let flagN: number = 0;
        if (this.vblank) {
            flagN = flagN | 0b00000001;
        }
        if (this.lcdStat) {
            flagN = flagN | 0b00000010;
        }
        if (this.timer) {
            flagN = flagN | 0b00000100;
        }
        if (this.serial) {
            flagN = flagN | 0b00001000;
        }
        if (this.joypad) {
            flagN = flagN | 0b00010000;
        }
        return flagN;
    }
}

export const VBLANK_VECTOR: number = 0x40;
export const LCD_STATUS_VECTOR: number = 0x48;
export const TIMER_OVERFLOW_VECTOR: number = 0x50;
export const SERIAL_LINK_VECTOR: number = 0x58;
export 
const JOYPAD_PRESS_VECTOR: number = 0x60;

// http://bgb.bircd.org/pandocs.htm / Useful info
export default class InterruptController {
    bus: MemoryBus;

    constructor(bus: MemoryBus) {
        this.bus = bus;
    }

    masterEnabled: boolean = true; // IME

    enabledInterrupts: InterruptFlag = new InterruptFlag(); // 0xFFFF
    requestedInterrupts: InterruptFlag = new InterruptFlag(); // 0xFF0F

    // Note: When an interrupt is fired, the master interrupt flag is disabled

    reset(): void {
        this.masterEnabled = true;

        this.enabledInterrupts.numerical = 0;
        this.requestedInterrupts.numerical = 0;
    }

    requestVblank(): void {
        this.requestedInterrupts.vblank = true;
    }

    requestLCDstatus(): void {
        this.requestedInterrupts.lcdStat = true;
    }

    requestTimer(): void {
        this.requestedInterrupts.timer = true;
    }

    requestSerial(): void {
        this.requestedInterrupts.serial = true;
    }

    requestJoypad(): void {
        this.requestedInterrupts.joypad = true;
    }
}