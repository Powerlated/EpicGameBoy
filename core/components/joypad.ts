import GameBoy from "../gameboy";
import { HWIO } from "../memory/hwio";
import { BIT_4, BIT_3, BIT_2, BIT_1, BIT_0, BIT_5 } from "../bit_constants";

export class JoypadRegister implements HWIO {

    /* Pandocs - Joypad Input
    Bit 7 - Not used
    Bit 6 - Not used
    Bit 5 - P15 Select Button Keys      (0=Select)
    Bit 4 - P14 Select Direction Keys   (0=Select)
    Bit 3 - P13 Input Down  or Start    (0=Pressed) (Read Only)
    Bit 2 - P12 Input Up    or Select   (0=Pressed) (Read Only)
    Bit 1 - P11 Input Left  or Button B (0=Pressed) (Read Only)
    Bit 0 - P10 Input Right or Button A (0=Pressed) (Read Only)
    */

    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    readHwio(addr: number): number {
        switch (addr) {
            case 0xFF00: // Joypad read
                // writeDebug("Polled joypad")
                return this.getNumerical() | 0b11000000;
        }

        return 0xFF;
    }
    writeHwio(addr: number, value: number): void {
        switch (addr) {
            case 0xFF00: // Joypad write
                this.setNumerical(value);
                break;
        }
    }

    selectButtons = true;
    selectDpad = true;

    private _down = false;
    private _up = false;
    private _left = false;
    private _right = false;

    private _start = false;
    private _select = false;
    private _a = false;
    private _b = false;

    public set down(v: boolean) {
        this._down = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }
    public set up(v: boolean) {
        this._up = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }
    public set left(v: boolean) {
        this._left = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }
    public set right(v: boolean) {
        this._right = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }

    public set start(v: boolean) {
        this._start = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }
    public set select(v: boolean) {
        this._select = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }
    public set a(v: boolean) {
        this._a = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }
    public set b(v: boolean) {
        this._b = v;
        if (v === true) this.gb.cpu.if.joypad = true;
    }

    getNumerical(): number {
        let n = 0xFF;

        if (this.selectDpad) {
            n &= ~BIT_4;

            if (this._down) n &= ~BIT_3;
            if (this._up) n &= ~BIT_2;
            if (this._left) n &= ~BIT_1;
            if (this._right) n &= ~BIT_0;
        }
        if (this.selectButtons) {
            n &= ~BIT_5;

            if (this._start) n &= ~BIT_3;
            if (this._select) n &= ~BIT_2;
            if (this._b) n &= ~BIT_1;
            if (this._a) n &= ~BIT_0;
        }
        return n;
    }

    setNumerical(i: number) {
        this.selectButtons = ((i >> 5) & 1) === 0; // Bit 5
        this.selectDpad = ((i >> 4) & 1) === 0; // Bit 4
    }
}
