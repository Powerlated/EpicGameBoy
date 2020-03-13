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

    selectButtons = false;
    selectDpad = false;

    dpad = {
        down: false,
        up: false,
        left: false,
        right: false
    };

    buttons = {
        start: false,
        select: false,
        a: false,
        b: false,
    };

    get numerical(): number {
        let n = 0;

        if (!this.selectButtons) n |= (1 << 5);
        if (!this.selectDpad) n |= (1 << 4);

        if (this.selectDpad) {
            if (!this.dpad.down) n |= (1 << 3);
            if (!this.dpad.up) n |= (1 << 2);
            if (!this.dpad.left) n |= (1 << 1);
            if (!this.dpad.right) n |= (1 << 0);
        } else if (this.selectButtons) {
            if (!this.buttons.start) n |= (1 << 3);
            if (!this.buttons.select) n |= (1 << 2);
            if (!this.buttons.b) n |= (1 << 1);
            if (!this.buttons.a) n |= (1 << 0);
        }
        return n;
    }

    set numerical(i: number) {
        this.selectButtons = ((i >> 5) & 1) === 0; // Bit 5
        this.selectDpad = ((i >> 4) & 1) === 0; // Bit 4
    }
}
