import MemoryBus from "../memory/memorybus";
import GameBoy from "../gameboy";
import { HWIO } from "../memory/hwio";

/**
 * Instances of this class are checked every single time the CPU 
 * executes an instruction, so I cache and lazy-update the 
 * numerical values for performance reasons.
 */
class InterruptFlag {
    private _vblank = false;
    private _lcdStat = false;
    private _timer = false;
    private _serial = false;
    private _joypad = false;

    get vblank() { return this._vblank; };
    get lcdStat() { return this._lcdStat; };
    get timer() { return this._timer; };
    get serial() { return this._serial; };
    get joypad() { return this._joypad; };

    set vblank(i: boolean) {
        this._vblank = i;
        this._numerical &= 0b11111110;
        if (this.vblank === true)
            this._numerical |= 0b11100001;
    };
    set lcdStat(i: boolean) {
        this._lcdStat = i;
        this._numerical &= 0b11111101;
        if (this.lcdStat === true)
            this._numerical |= 0b11100010;
    };
    set timer(i: boolean) {
        this._timer = i;
        this._numerical &= 0b11111011;
        if (this.timer === true)
            this._numerical |= 0b11100100;
    };
    set serial(i: boolean) {
        this._serial = i;
        this._numerical &= 0b11110111;
        if (this.serial === true)
            this._numerical |= 0b11101000;
    };
    set joypad(i: boolean) {
        this._joypad = i;
        this._numerical &= 0b11101111;
        if (this.joypad === true)
            this._numerical |= 0b11110000;
    };

    private _numerical = 0;

    set numerical(i: number) {
        this.vblank = (i & (1 << 0)) !== 0;
        this.lcdStat = (i & (1 << 1)) !== 0;
        this.timer = (i & (1 << 2)) !== 0;
        this.serial = (i & (1 << 3)) !== 0;
        this.joypad = (i & (1 << 4)) !== 0;

        // Just store this flag and return it later, it's faster
        this._numerical = i;
        return;
    }

    get numerical() {
        return this._numerical;
    }
}

export const VBLANK_VECTOR = 0x40;
export const LCD_STATUS_VECTOR = 0x48;
export const TIMER_OVERFLOW_VECTOR = 0x50;
export const SERIAL_LINK_VECTOR = 0x58;
export const JOYPAD_PRESS_VECTOR = 0x60;

// http://bgb.bircd.org/pandocs.htm / Useful info
export default class InterruptController {
    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    masterEnabled = true; // IME

    enabled = new InterruptFlag(); // 0xFFFF
    requested = new InterruptFlag(); // 0xFF0F

    // Note: When an interrupt is *handled*, the master interrupt flag is disabled

    reset() {
        this.masterEnabled = true;

        this.enabled.numerical = 0;
        this.requested.numerical = 0;
    }
}