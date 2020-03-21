import CPU from './core/cpu/cpu';
import GPU from './core/video/gpu';
import MemoryBus from './core/memory/memorybus';
import Disassembler from './tools/disassembler';
import { writeDebug } from './tools/debug';
import SoundChip from './core/sound/sound';
import Timer from './core/components/timer';
import Decoder from './core/cpu/decoder';

export default class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    cgb: boolean;

    soundChip = new SoundChip(this);

    timer = new Timer(this);

    constructor(cgb: boolean) {
        writeDebug("New gameboy!");
        this.cgb = cgb;
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
        this.soundChip.tjs.setMuted(true);
    }

    speed() {
        this.cpu.debugging = false;
        this.speedIntervals.push(setInterval(() => { this.frame(); }, 16));
        this.soundChip.tjs.setMuted(false);
    }

    frame() {
        let i = 0;
        // const max = 70224; // Full frame GPU timing
        const max = 70224 * this.speedMul; // Full frame GPU timing, double speed

        while (i < max) {
            if (this.cpu.breakpoints[this.cpu.pc]) {
                this.speedStop();
                return;
            }
            this.step();
            i += this.cpu.lastInstructionCycles;
        }
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

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler, Decoder }; 