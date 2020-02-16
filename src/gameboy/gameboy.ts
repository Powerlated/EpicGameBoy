class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);
    
    constructor() {
        console.log("New gameboy!")
    }
}