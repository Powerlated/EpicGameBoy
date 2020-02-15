

class InterruptFlag {
    vblank = false;
    lcdStat = false;
    timer = false;
    serial = false;
    joypad = false;


    set numerical(i: number) {
        this.vblank = (i & (1 << 0)) != 0;
        this.lcdStat = (i & (1 << 1)) != 0;
        this.timer = (i & (1 << 2)) != 0;
        this.serial = (i & (1 << 3)) != 0;
        this.joypad = (i & (1 << 4)) != 0;
        return;
    }

    get numerical(): number {
        let flagN = 0;
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

const VBLANK_VECTOR = 0x40;
const LCD_STATUS_VECTOR = 0x48;
const TIMER_OVERFLOW_VECTOR = 0x50;
const SERIAL_LINK_VECTOR = 0x58;
const JOYPAD_PRESS_VECTOR = 0x60;

// http://bgb.bircd.org/pandocs.htm / Useful info
class InterruptController {
    masterEnabled = true; // IME

    enabledInterrupts = new InterruptFlag(); // 0xFFFF
    requestedInterrupts = new InterruptFlag(); // 0xFF0F

    // Note: When an interrupt is fired, the master interrupt flag is disabled

    attemptVblank() {
        console.log("Attempting vblank");
        if (this.enabledInterrupts.vblank) {
            this.requestedInterrupts.vblank = true;
        }
    }

    attemptLCDstatus() {
        if (this.enabledInterrupts.lcdStat) {
            this.requestedInterrupts.lcdStat = true;
        }
    }

    attemptTimer() {
        if (this.enabledInterrupts.timer) {
            this.requestedInterrupts.timer = true;
        }
    }

    attemptSerial() {
        if (this.enabledInterrupts.serial) {
            this.requestedInterrupts.serial = true;
        }
    }

    attemptJoypad() {
        if (this.enabledInterrupts.joypad) {
            this.requestedInterrupts.joypad = true;
        }
    }
}