import MemoryBus from "../memory/memorybus";
import GameBoy from "../gameboy";
import { HWIO } from "../memory/hwio";
import { BIT_0, BIT_1, BIT_2, BIT_3, BIT_4 } from "../bit_constants";
import { Serializer, PUT_BOOL, PUT_8, GET_BOOL, GET_8 } from "../serialize";

/**
 * Instances of this class are checked every single time the CPU 
 * executes an instruction, so I cache and lazy-update the 
 * numerical values for performance reasons.
 */
class InterruptFlag {
    ie = false;

    constructor(ie: boolean) {
        this.ie = ie;
    }

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
        if (i === true)
            this.numerical |= BIT_0;
        else
            this.numerical &= ~BIT_0;
    }
    set lcdStat(i: boolean) {
        this._lcdStat = i;
        if (i === true)
            this.numerical |= BIT_1;
        else
            this.numerical &= ~BIT_1;
    };
    set timer(i: boolean) {
        this._timer = i;
        if (i === true)
            this.numerical |= BIT_2;
        else
            this.numerical &= ~BIT_2;
    };
    set serial(i: boolean) {
        this._serial = i;
        if (i === true)
            this.numerical |= BIT_3;
        else
            this.numerical &= ~BIT_3;
    };
    set joypad(i: boolean) {
        this._joypad = i;
        if (i === true)
            this.numerical |= BIT_4;
        else
            this.numerical &= ~BIT_4;
    };

    numerical = 0;

    getNumerical(): number {
        return this.numerical;
    }

    setNumerical(i: number) {
        this.vblank = (i & BIT_0) !== 0;
        this.lcdStat = (i & BIT_1) !== 0;
        this.timer = (i & BIT_2) !== 0;
        this.serial = (i & BIT_3) !== 0;
        this.joypad = (i & BIT_4) !== 0;

        // Just store this flag and return it later, it's faster
        this.numerical = i;

        // Interrupt Flag is external to the SM83 core, so it only has 5 lines
        if (!this.ie)
            this.numerical |= 0b11100000;
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

    enabled = new InterruptFlag(true); // 0xFFFF
    requested = new InterruptFlag(false); // 0xFF0F

    // Note: When an interrupt is *handled*, the master interrupt flag is disabled

    reset() {
        this.masterEnabled = true;

        this.enabled = new InterruptFlag(true); // 0xFFFF
        this.requested = new InterruptFlag(false); // 0xFF0F
    }

    serialize(state: Serializer) {
        PUT_BOOL(state, this.masterEnabled);

        PUT_BOOL(state, this.enabled.ie);
        PUT_BOOL(state, this.enabled._vblank);
        PUT_BOOL(state, this.enabled._lcdStat);
        PUT_BOOL(state, this.enabled._timer);
        PUT_BOOL(state, this.enabled._serial);
        PUT_BOOL(state, this.enabled._joypad);
        PUT_8(state, this.enabled.numerical);

        PUT_BOOL(state, this.requested.ie);
        PUT_BOOL(state, this.requested._vblank);
        PUT_BOOL(state, this.requested._lcdStat);
        PUT_BOOL(state, this.requested._timer);
        PUT_BOOL(state, this.requested._serial);
        PUT_BOOL(state, this.requested._joypad);
        PUT_8(state, this.requested.numerical);
    }

    deserialize(state: Serializer) {
        this.masterEnabled = GET_BOOL(state);

        this.enabled.ie = GET_BOOL(state);
        this.enabled._vblank = GET_BOOL(state);
        this.enabled._lcdStat = GET_BOOL(state);
        this.enabled._timer = GET_BOOL(state);
        this.enabled._serial = GET_BOOL(state);
        this.enabled._joypad = GET_BOOL(state);
        this.enabled.numerical = GET_8(state);

        this.requested.ie = GET_BOOL(state);
        this.requested._vblank = GET_BOOL(state);
        this.requested._lcdStat = GET_BOOL(state);
        this.requested._timer = GET_BOOL(state);
        this.requested._serial = GET_BOOL(state);
        this.requested._joypad = GET_BOOL(state);
        this.requested.numerical = GET_8(state);
    }
}