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

    cpuPausedTCyclesRemaining = 0;
    oamDmaTCyclesRemaining = 0;

    soundChip = new SoundChip(this);

    stopNow = true;

    timer = new Timer(this);

    constructor(cgb: boolean) {
        writeDebug("New gameboy!");
        this.cgb = cgb;
        setInterval(() => { this.bus.ext.saveGameSram(); }, 100);
    }

    step(): number {
        let cyclesBehind = 0;

        let runFor = this.getCyclesUntilNextSync();

        // Use a do-while loop because we want the CPU to run at least once
        do {
            let lastInstructionCycles = 4;
            if (this.cpuPausedTCyclesRemaining > 0) {
                this.cpuPausedTCyclesRemaining -= 4;
            } else {
                lastInstructionCycles = this.cpu.step();
                cyclesBehind += lastInstructionCycles;
            }

            if (this.oamDmaTCyclesRemaining > 0) {
                this.oamDmaTCyclesRemaining -= lastInstructionCycles;
            }

            // Just in case for some reason cyclesBehind is < 4
            if (cyclesBehind < 4) cyclesBehind = 4;
        } while (cyclesBehind < runFor);

        // This is the value we are going to pass to the other components 
        let stepCycles = cyclesBehind;
        // In double speed mode make the CPU run 2x relatively faster than all the other components
        if (this.doubleSpeed) stepCycles >>= 1;

        // Timer runs at double speed as well, so use the unmodified value for timer
        this.timer.step(cyclesBehind);
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

    getCyclesUntilNextSync(): number {
        let timer = Timer.TimerSpeeds[this.timer.control.speed] - this.timer.mainClock;
        let gpu = 0;
        switch (this.gpu.lcdStatus.mode) {
            // OAM Mode
            case 2:
                gpu = 80 - this.gpu.modeClock;
                break;

            // VRAM Mode
            case 3:
                // If we haven't drawn the BG, sync now
                if (this.gpu.bgDrawn) {
                    gpu = 172 - this.gpu.modeClock;
                } else {
                    gpu = 0;
                }
                break;

            // Hblank
            case 0:
                gpu = 204 - this.gpu.modeClock;
                break;

            // Vblank
            case 1:
                gpu = 456 - this.gpu.modeClock;
                break;

            // Line 153
            case 4:
                break;
        }

        // If there's no hardware waiting for sync, just sync in 256 cycles
        let final = 256;
        if (this.timer.control.running && this.gpu.lcdControl.lcdDisplayEnable7) {
            final = Math.min(timer, gpu);
        } else if (this.gpu.lcdControl.lcdDisplayEnable7) {
            final = gpu;
        }

        return final;
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

        this.cpuPausedTCyclesRemaining = 0;
        this.oamDmaTCyclesRemaining = 0;
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler, Decoder }; 