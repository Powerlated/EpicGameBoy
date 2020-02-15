class InterruptController {
    interruptEnableFlag = new InterruptFlag();
    interruptHappenFlag = new InterruptFlag();

    interruptVblank() {
        console.log("VBLANK");
    }

    interruptLCDstat() {

    }

    interruptTimer() {

    }

    interruptSerial() {

    }

    interruptJoypad() {

    }
}