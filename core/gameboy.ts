import CPU, { R16 } from './cpu/cpu';
import GPU from './video/gpu';
import MemoryBus from './memory/memorybus';
import Disassembler from '../src/gameboy/tools/disassembler';
import { writeDebug } from '../src/gameboy/tools/debug';
import SoundChip from './sound/sound';
import Timer from './components/timer';
import Decoder from './cpu/legacy_decoder';
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
        let cyclesRan = 0;

        let runFor = this.getCyclesUntilNextSync();

        // Use a do-while loop because we want the CPU to run at least once
        do {
            let lastInstructionCycles = 4;
            if (this.cpuPausedTCyclesRemaining > 0) {
                this.cpuPausedTCyclesRemaining -= 4;
            } else {
                lastInstructionCycles = this.cpu.step();
            }

            cyclesRan += lastInstructionCycles;

            if (this.oamDmaTCyclesRemaining > 0) {
                this.oamDmaTCyclesRemaining -= lastInstructionCycles;
            }
        } while (cyclesRan < runFor);

        // This is the value we are going to pass to the other components 
        let stepCycles = cyclesRan;
        // In double speed mode make the CPU run 2x relatively faster than Sound and GPU
        if (this.doubleSpeed) stepCycles >>= 1;

        // Timer runs at double speed as well, so use the unmodified value for timer
        this.timer.step(cyclesRan);
        this.soundChip.step(stepCycles);
        this.gpu.step(stepCycles);

        return stepCycles;
    }

    speedMul = 1;
    speedIntervals: Array<number> = [];

    speedStop() {
        this.speedIntervals.forEach(i => { clearInterval(i); });
        this.soundChip.setMuted(true);
        this.stopNow = true;
    }

    speed() {
        this.cpu.debugging = false;
        this.speedIntervals.push(setInterval(() => { this.frame(); }, 10));
        this.soundChip.setMuted(false);
    }

    lastTime = 0;
    frame() {
        let now = performance.now();
        let deltaMs = now - this.lastTime;
        if (deltaMs > 20) deltaMs = 20; // limit this for performance reasons
        this.lastTime = now;

        // We're not using 4194.304 here because that matches up to ~59.7275 FPS, not 60.
        const max = 4213.440 * deltaMs * this.speedMul;

        for (let i = 0; i < max && !this.stopNow;) {
            if (this.cpu.breakpoints[this.cpu.pc] === true) {
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
                    gpu = 172 - this.gpu.modeClock + this.gpu.mode3CyclesOffset;
                } else {
                    gpu = 0;
                }
                break;

            // Hblank
            case 0:
                gpu = 204 - this.gpu.modeClock - this.gpu.mode3CyclesOffset;
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

        if (this.bus.bootromEnabled && (!this.bus.bootromLoaded || this.cgb)) {
            console.log("No bootrom is loaded, starting execution at 0x100 with proper values loaded");
            this.cpu.pc = 0x100;

            // Games check A for 0x11 to detect a CGB
            if (this.cgb) {
                this.cpu.reg[R16.AF] = 0x1180;
                this.cpu.reg[R16.BC] = 0x0000;
                this.cpu.reg[R16.DE] = 0xFF56;
                this.cpu.reg[R16.HL] = 0x000D;
                this.cpu.reg.sp = 0xFFFE;
            } else {
                this.cpu.reg[R16.AF] = 0x01B0;
                this.cpu.reg[R16.BC] = 0x0013;
                this.cpu.reg[R16.DE] = 0x00D8;
                this.cpu.reg[R16.HL] = 0x014D;
                this.cpu.reg.sp = 0xFFFE;
            }



            this.bus.writeMem8(0xFF05, 0x00); // TIMA
            this.bus.writeMem8(0xFF06, 0x00); // TMA
            this.bus.writeMem8(0xFF07, 0x00); // TAC

            this.bus.writeMem8(0xFF10, 0x80); // NR10 
            this.bus.writeMem8(0xFF11, 0xBF); // NR11
            this.bus.writeMem8(0xFF12, 0xF3); // NR12
            this.bus.writeMem8(0xFF14, 0xBF); // NR14

            this.bus.writeMem8(0xFF16, 0x3F); // NR21
            this.bus.writeMem8(0xFF17, 0x00); // NR22
            this.bus.writeMem8(0xFF19, 0x00); // NR24

            this.bus.writeMem8(0xFF1A, 0x7F); // NR30
            this.bus.writeMem8(0xFF1B, 0xFF); // NR31
            this.bus.writeMem8(0xFF1C, 0x9F); // NR32
            this.bus.writeMem8(0xFF1E, 0xBF); // NR33

            this.bus.writeMem8(0xFF20, 0xFF); // NR41
            this.bus.writeMem8(0xFF21, 0x00); // NR42
            this.bus.writeMem8(0xFF22, 0x00); // NR43
            this.bus.writeMem8(0xFF23, 0xBF); // NR44

            this.bus.writeMem8(0xFF24, 0x77); // NR50
            this.bus.writeMem8(0xFF25, 0xF3); // NR51


            this.bus.writeMem8(0xFF26, 0xF1); // - GB, $F0 - SGB; NR52
            this.bus.writeMem8(0xFF40, 0x91); // LCDC
            this.bus.writeMem8(0xFF42, 0x00); // SCY
            this.bus.writeMem8(0xFF43, 0x00); // SCX
            this.bus.writeMem8(0xFF45, 0x00); // LYC
            this.bus.writeMem8(0xFF47, 0xFC); // BGP
            this.bus.writeMem8(0xFF48, 0xFF); // OBP0
            this.bus.writeMem8(0xFF49, 0xFF); // OBP1
            this.bus.writeMem8(0xFF4A, 0x00); // WY
            this.bus.writeMem8(0xFF4B, 0x00); // WX
            this.bus.writeMem8(0xFFFF, 0x00); // IE;

            // Make a write to disable the bootrom
            this.bus.writeMem8(0xFF50, 1);
        }
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler, Decoder }; 