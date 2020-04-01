import CPU from './cpu/cpu';
import GPU from './video/gpu';
import MemoryBus from './memory/memorybus';
import Disassembler from '../src/gameboy/tools/disassembler';
import { writeDebug } from '../src/gameboy/tools/debug';
import SoundChip from './sound/sound';
import Timer from './components/timer';
import Decoder from './cpu/old_decoder';
import { DMAController } from './memory/dma';
import InterruptController from './components/interrupt-controller';
import { JoypadRegister } from './components/joypad';

export default class GameBoy {
    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    joypad = new JoypadRegister(this);

    interrupts = new InterruptController(this);

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

    step(): number {
        let lastInstructionCycles = 4;

        if (this.cpuPausedNormalSpeedMcycles > 0) {
            this.cpuPausedNormalSpeedMcycles--;
        } else {
            lastInstructionCycles = this.cpu.step();
        }

        
        if (this.oamDmaNormalMCyclesRemaining > 0) {
            this.oamDmaNormalMCyclesRemaining -= (lastInstructionCycles >> 2);
        }

        // This is the value we are going to pass to the other components 
        let stepCycles = lastInstructionCycles;
        if (this.doubleSpeed) stepCycles >>= 1;


        this.timer.step(lastInstructionCycles);
        this.soundChip.step(stepCycles);
        this.gpu.step(stepCycles);

        return stepCycles;
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

            i += this.step();
        }

        if (this.stopNow == true) {
            this.stopNow = false;
        }
    }



    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
        this.soundChip.reset();
        this.dma.reset();

        this.doubleSpeed = false;
        this.prepareSpeedSwitch = false;

        this.cpuPausedNormalSpeedMcycles = 0;
        this.oamDmaNormalMCyclesRemaining = 0;
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler, Decoder }; 