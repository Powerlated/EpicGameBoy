import CPU from './core/cpu';
import GPU from './core/gpu';
import MemoryBus from './core/memorybus';
import Timer from './components/timer';
import SoundChip from './components/sound/sound';
import Disassembler from './tools/disassembler';

export default class GameBoy {
    cpu: CPU = new CPU(this);
    gpu: GPU = new GPU(this);
    bus: MemoryBus = new MemoryBus(this);

    soundChip: SoundChip = new SoundChip(this);

    timer: Timer = new Timer(this);

    constructor() {
        console.log("New gameboy!");
    }

    step(): void {
        this.soundChip.step();
        this.cpu.step();
        this.gpu.step();
        this.timer.step();
    }

    speedMul: number = 1;
    speedIntervals: Array<number> = [];

    speedStop(): void {
        this.speedIntervals.forEach((v, i, a) => { clearInterval(v); });
        this.cpu.stopNow = true;
    }

    speed(): void {
        this.cpu.debugging = false;
        this.speedIntervals.push(setInterval(() => { this.frame(); }, 16));
        this.soundChip.setMuted(false);
    }

    frame(): void {
        let i = 0;
        // const max = 70224; // Full frame GPU timing
        const max = 70224 * this.speedMul; // Full frame GPU timing, double speed
        if (this.cpu.breakpoints.has(this.cpu.pc) || this.cpu.stopNow) {
            this.speedStop();
        }
        while (i < max && !this.cpu.breakpoints.has(this.cpu.pc) && !this.cpu.stopNow) {
            this.step();
            i += this.cpu.lastInstructionCycles;
        }
        if (this.cpu.stopNow) this.cpu.stopNow = false;
    }



    reset(): void {
        this.cpu.reset();
        this.gpu.reset();
        this.bus.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
        this.soundChip.reset();
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler }; 