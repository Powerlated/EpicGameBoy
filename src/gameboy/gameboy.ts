class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    soundChip = new SoundChip(this);

    timer = new Timer(this);

    constructor() {
        console.log("New gameboy!");
    }

    step() {
        this.soundChip.step();
        this.cpu.step();
        this.gpu.step();
        this.timer.step();
    }

    speedMul = 1;
    speedInterval = 0;
    speedRunning = false;

    speedStop() {
        if (this.speedRunning) {
            clearInterval(this.speedInterval);
            this.cpu.stopNow = true;
            this.speedRunning = false;
            this.soundChip.setMuted(true);
        }
    }

    speed() {
        if (!this.speedRunning) {
            this.cpu.debugging = false;
            this.speedInterval = setInterval(() => { this.frame() }, 16)
            this.speedRunning = true;
            this.soundChip.setMuted(false);
        }

    }

    frame() {
        let i = 0;
        // const max = 70224; // Full frame GPU timing
        const max = 70224 * this.speedMul; // Full frame GPU timing, double speed
        if (this.cpu.breakpoints.has(this.cpu.pc) || this.cpu.stopNow) {
            clearInterval(this.speedInterval);
        }
        while (i < max && !this.cpu.breakpoints.has(this.cpu.pc) && !this.cpu.stopNow) {
            this.step();
            i += this.cpu.lastInstructionCycles;
        }
        if (this.cpu.stopNow) this.cpu.stopNow = false;
    }



    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.bus.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
        this.soundChip.reset();
    }
}