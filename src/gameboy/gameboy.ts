class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    timer = new Timer(this);
    
    constructor() {
        console.log("New gameboy!")
    }

    
    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.bus.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
    }
}