import CPU from './cpu/cpu';
import GPU from './core/gpu';
import MemoryBus from './core/memorybus';
import Disassembler from './tools/disassembler';
import { writeDebug } from './tools/debug';
import SoundChip from './core/components/sound/sound';
import Timer from './core/components/timer';

export default class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    soundChip = new SoundChip(this);

    timer = new Timer(this);

    constructor() {
        writeDebug("New gameboy!");

        setInterval(() => { this.bus.ext.saveGameSram(); }, 1000);
    }

    step() {
        this.soundChip.step();
        this.cpu.step();
        this.gpu.step();
        this.timer.step();
    }

    speedMul = 1;
    speedIntervals: Array<number> = [];

    speedStop() {
        this.speedIntervals.forEach(i => { clearInterval(i); });
        this.cpu.stopNow = true;
        this.soundChip.tjs.setMuted(true);
    }

    speed() {
        this.cpu.debugging = false;
        this.cpu.stopNow = false;
        this.speedIntervals.push(setInterval(() => { this.frame(); }, 16));
        this.soundChip.tjs.setMuted(false);
    }

    frame() {
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



    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.bus.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
        this.soundChip.reset();
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler }; 