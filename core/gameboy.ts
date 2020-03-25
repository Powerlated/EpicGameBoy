import CPU from './cpu/cpu';
import GPU from './video/gpu';
import MemoryBus from './memory/memorybus';
import Disassembler from '../src/gameboy/tools/disassembler';
import { writeDebug } from '../src/gameboy/tools/debug';
import SoundChip from './sound/sound';
import Timer from './components/timer';
import Decoder from './cpu/decoder';
import { DMAController } from './memory/dma';

export default class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    dma = new DMAController(this);

    cgb = false;
    doubleSpeed = false;
    prepareSpeedSwitch = false;

    cpuPausedNormalSpeedMcycles = 0;
    oamDmaNormalMCyclesRemaining = 0;

    soundChip = new SoundChip(this);

    stopNow = true;

    timer = new Timer(this);

    constructor(cgb: boolean) {
        writeDebug("New gameboy!");
        this.cgb = cgb;
        setInterval(() => { this.bus.ext.saveGameSram(); }, 100);
    }

    step() {
        if (this.cpuPausedNormalSpeedMcycles == 0) {
            this.handleCpu();
        } else {
            this.cpu.lastInstructionCycles = 4;
            this.cpuPausedNormalSpeedMcycles--;
        }
        this.timer.step();

        if (this.doubleSpeed) {
            if (this.cpuPausedNormalSpeedMcycles == 0) {
                this.handleCpu();
            } else {
                this.cpu.lastInstructionCycles = 4;
            }
            this.timer.step();
        }

        this.soundChip.step();
        this.gpu.step();
    }

    handleCpu() {
        this.cpu.step();
        if (this.oamDmaNormalMCyclesRemaining > 0) {
            this.oamDmaNormalMCyclesRemaining -= (this.cpu.lastInstructionCycles >> 2);
        }
    }

    speedMul = 1;
    speedIntervals: Array<number> = [];

    speedStop() {
        this.speedIntervals.forEach(i => { clearInterval(i); });
        this.soundChip.tjs.setMuted(true);
        this.stopNow = true;
    }

    speed() {
        this.cpu.debugging = false;
        this.speedIntervals.push(setInterval(() => { this.frame(); }, 16));
        this.soundChip.tjs.setMuted(false);
    }

    frame() {
        let i = 0;
        // const max = 70224; // Full frame GPU timing
        const max = 67000 * this.speedMul; // Full frame GPU timing

        while (i < max && !this.stopNow) {
            if (this.cpu.breakpoints[this.cpu.pc]) {
                this.speedStop();
                return;
            }
            this.step();
            i += this.cpu.lastInstructionCycles;
        }

        if (this.stopNow == true) {
            this.stopNow = false;
        }
    }



    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.bus.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
        this.soundChip.reset();
        this.dma.reset();

        this.doubleSpeed = false;
        this.prepareSpeedSwitch = false;
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler, Decoder }; 