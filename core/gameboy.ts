import CPU, { R16 } from './cpu/cpu';
import GPU from './video/gpu';
import MemoryBus from './memory/memorybus';
import Disassembler from '../src/gameboy/tools/disassembler';
import { writeDebug } from '../src/gameboy/tools/debug';
import SoundChip from './sound/sound';
import Timer from './components/timer';
import { DMAController } from './memory/dma';
import InterruptController from './components/interrupt-controller';
import { JoypadRegister } from './components/joypad';
import { SerialPort } from './components/serial';

export default class GameBoy {
    constructor(cgb: boolean) {
        writeDebug("New gameboy!");
        this.cgb = cgb;
        setInterval(() => { this.bus.ext.saveGameSram(); }, 100);
    }

    cpu = new CPU(this);
    gpu = new GPU(this);
    bus = new MemoryBus(this);

    serial = new SerialPort();

    joypad = new JoypadRegister(this);

    interrupts = new InterruptController(this);

    dma = new DMAController(this);

    cgb = false;
    doubleSpeed = false;
    prepareSpeedSwitch = false;

    cpuPausedTCyclesRemaining = 0;
    oamDmaCyclesRemaining = 0;

    soundChip = new SoundChip(this);

    stopNow = true;

    timer = new Timer(this);

    speedMul = 1;
    speedIntervals: Array<number> = [];

    step(): number {
        let cyclesRan = 0;

        // Use a do-while loop because we want the CPU to run at least once
        let lastInstructionCycles = 4;
        if (this.cpuPausedTCyclesRemaining > 0) {
            this.cpuPausedTCyclesRemaining = 0;
            this.tick(this.cpuPausedTCyclesRemaining);
        } else {
            lastInstructionCycles = this.cpu.execute();
        }

        cyclesRan += lastInstructionCycles;


        // This is the value we are going to pass to the other components 
        let stepCycles = cyclesRan;
        // In double speed mode make the CPU run 2x relatively faster than Sound and GPU
        if (this.doubleSpeed) stepCycles >>= 1;

        return stepCycles;
    }

    until = 0;
    pending = 0;

    tick(cyclesRan: number) {
        let stepCycles = cyclesRan;

        if (this.oamDmaCyclesRemaining > 0) {
            this.oamDmaCyclesRemaining -= cyclesRan;
        }

        if (this.doubleSpeed === true) stepCycles >>= 1;
        // Timer runs at double speed as well, so use the unmodified value for timer
        this.timer.tick(cyclesRan);
        this.soundChip.tick(stepCycles);

        // this.pending += stepCycles;

        // if (
        //     this.pending >= this.until || this.gpu.catchupNow === true &&
        //     (this.dma.hDmaRemaining > 0 && this.dma.hDmaPaused === false)
        // ) {
        //     this.gpu.catchupNow = false;

        //     this.until = this.getCyclesUntilNextSync();

            this.gpu.tick(this.pending);
        //     this.pending = 0;
        // }
    }

    speedStop() {
        this.speedIntervals.forEach(i => { clearInterval(i); });
        this.soundChip.setMuted(true);
        this.stopNow = true;
    }

    speed() {
        this.cpu.debugging = false;
        this.speedIntervals.push(setInterval(this.frame.bind(this), 10));
        this.soundChip.setMuted(false);
    }

    lastTime = 0;
    frame() {
        let now = performance.now();
        let deltaMs = now - this.lastTime;
        if (deltaMs > (1000 / 60)) deltaMs = (1000 / 60); // limit this for performance reasons
        this.lastTime = now;

        // We're not using 4194.304 here because that matches up to ~59.7275 FPS, not 60.
        const max = 4213.440 * deltaMs * this.speedMul;


        let i = 0;
        while (i < max) {
            i += this.step();
        }

        if (this.stopNow == true) {
            this.stopNow = false;
        }
    }

    getCyclesUntilNextSync(): number {
        let gpu = 0;
        switch (this.gpu.lcdStatus.mode) {
            // OAM Mode
            case 2:
                gpu = 80 - this.gpu.lineClock;
                break;

            // VRAM Mode
            case 3:
                // Mode 3 is very sensitive, don't touch this
                gpu = 0;
                break;

            // Hblank
            case 0:
                gpu = 204 - this.gpu.lineClock;
                break;

            // Vblank
            case 1:
                // For the last line, no skip
                if (this.gpu.lY < 152)
                    gpu = 456 - this.gpu.lineClock;
                break;

            // Line 153
            case 5:
                break;
        }

        return gpu >> 1;
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
        this.oamDmaCyclesRemaining = 0;

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



            this.bus.write(0xFF05, 0x00); // TIMA
            this.bus.write(0xFF06, 0x00); // TMA
            this.bus.write(0xFF07, 0x00); // TAC

            this.bus.write(0xFF10, 0x80); // NR10 
            this.bus.write(0xFF11, 0xBF); // NR11
            this.bus.write(0xFF12, 0xF3); // NR12
            this.bus.write(0xFF14, 0xBF); // NR14

            this.bus.write(0xFF16, 0x3F); // NR21
            this.bus.write(0xFF17, 0x00); // NR22
            this.bus.write(0xFF19, 0x00); // NR24

            this.bus.write(0xFF1A, 0x7F); // NR30
            this.bus.write(0xFF1B, 0xFF); // NR31
            this.bus.write(0xFF1C, 0x9F); // NR32
            this.bus.write(0xFF1E, 0xBF); // NR33

            this.bus.write(0xFF20, 0xFF); // NR41
            this.bus.write(0xFF21, 0x00); // NR42
            this.bus.write(0xFF22, 0x00); // NR43
            this.bus.write(0xFF23, 0xBF); // NR44

            this.bus.write(0xFF24, 0x77); // NR50
            this.bus.write(0xFF25, 0xF3); // NR51


            this.bus.write(0xFF26, 0xF1); // - GB, $F0 - SGB; NR52
            this.bus.write(0xFF40, 0x91); // LCDC
            this.bus.write(0xFF42, 0x00); // SCY
            this.bus.write(0xFF43, 0x00); // SCX
            this.bus.write(0xFF45, 0x00); // LYC
            this.bus.write(0xFF47, 0xFC); // BGP
            this.bus.write(0xFF48, 0xFF); // OBP0
            this.bus.write(0xFF49, 0xFF); // OBP1
            this.bus.write(0xFF4A, 0x00); // WY
            this.bus.write(0xFF4B, 0x00); // WX
            this.bus.write(0xFFFF, 0x00); // IE;

            // Make a write to disable the bootrom
            this.bus.write(0xFF50, 1);
        }
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler }; 