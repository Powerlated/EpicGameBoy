import GameBoy from "../gameboy";

export class JoypadRegister {

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

    selectButtons = false;
    selectDpad = false;

    private _down = false;
    private _up = false;
    private _left = false;
    private _right = false;

    private _start = false;
    private _select = false;
    private _a = false;
    private _b = false;

    public get down() { return this._down; }
    public get up() { return this._up; }
    public get left() { return this._left; }
    public get right() { return this._right; }

    public get start() { return this._start; }
    public get select() { return this._select; }
    public get a() { return this._a; }
    public get b() { return this._b; }


    public set down(v: boolean) {
        this._down = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }
    public set up(v: boolean) {
        this._up = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }
    public set left(v: boolean) {
        this._left = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }
    public set right(v: boolean) {
        this._right = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }

    public set start(v: boolean) {
        this._start = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }
    public set select(v: boolean) {
        this._select = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }
    public set a(v: boolean) {
        this._a = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }
    public set b(v: boolean) {
        this._b = v;
        if (v === true) this.gb.interrupts.requested.joypad = true;
    }

    get numerical(): number {
        let n = 0xFF;

        if (this.selectButtons) n &= ~(1 << 5);
        if (this.selectDpad) n &= ~(1 << 4);

        if (this.selectDpad) {
            if (this.down) n &= ~(1 << 3);
            if (this.up) n &= ~(1 << 2);
            if (this.left) n &= ~(1 << 1);
            if (this.right) n &= ~(1 << 0);
        }
        if (this.selectButtons) {
            if (this.start) n &= ~(1 << 3);
            if (this.select) n &= ~(1 << 2);
            if (this.b) n &= ~(1 << 1);
            if (this.a) n &= ~(1 << 0);
        }
        return n;
    }

    set numerical(i: number) {
        this.selectButtons = ((i >> 5) & 1) === 0; // Bit 5
        this.selectDpad = ((i >> 4) & 1) === 0; // Bit 4
    }
}
