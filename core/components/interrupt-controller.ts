import MemoryBus from "../memory/memorybus";
import GameBoy from "../gameboy";

class InterruptFlag {
    _vblank = false;
    _lcdStat = false;
    _timer = false;
    _serial = false;
    _joypad = false;

    get vblank() { return this._vblank; };
    get lcdStat() { return this._lcdStat; };
    get timer() { return this._timer; };
    get serial() { return this._serial; };
    get joypad() { return this._joypad; };

    set vblank(i: boolean) {
        this._vblank = i;
        this._numerical &= 0b11111110;
        if (this.vblank)
            this._numerical |= 0b00000001;
    };
    set lcdStat(i: boolean) {
        this._lcdStat = i;
        this._numerical &= 0b11111101;
        if (this.lcdStat)
            this._numerical |= 0b00000010;
    };
    set timer(i: boolean) {
        this._timer = i;
        this._numerical &= 0b11111011;
        if (this.timer)
            this._numerical |= 0b00000100;
    };
    set serial(i: boolean) {
        this._serial = i;
        this._numerical &= 0b11110111;
        if (this.serial)
            this._numerical |= 0b00001000;
    };
    set joypad(i: boolean) {
        this._joypad = i;
        this._numerical &= 0b11101111;
        if (this.joypad)
            this._numerical |= 0b00010000;
    };

    _numerical = 0;

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

    get numerical(): number {
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