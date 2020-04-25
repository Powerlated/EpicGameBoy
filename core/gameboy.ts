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

        /* 
        * Intervals run while out of the tab as opposed to animation frames, which are
        * stopped by the browser when the user leaves the active tab.
        * 
        * A timer is constantly refreshed by frame() and when the timer runs out,
        * mute the audio.
        */
        setInterval(() => {
            if (this.soundChip.getMuted() === true && this.millisUntilMuteAudio === 100) {
                this.soundChip.setMuted(false);
            } else if (this.millisUntilMuteAudio < 0) {
                this.soundChip.setMuted(true);
            }

            if (this.millisUntilMuteAudio >= 0) {
                this.millisUntilMuteAudio -= 50;
            }
        }, 50);
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
    currentlyRunning = false;
    animationFrame = 0;
    millisUntilMuteAudio = 0;

    step(): number {
        if (this.cpuPausedTCyclesRemaining !== 0) {
            const remaining = this.cpuPausedTCyclesRemaining;
            this.cpuPausedTCyclesRemaining = 0;

            this.tick(remaining - 4);
            this.tick(4);
            return remaining;
        } else {
            return this.cpu.execute();
        }
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
        // The APU is ticked by the timer so it's the timer class
        this.gpu.tick(stepCycles);
    }

    speedStop() {
        cancelAnimationFrame(this.animationFrame);
        this.soundChip.setMuted(true);
        this.stopNow = true;

        this.currentlyRunning = false;
    }

    speed() {
        this.cpu.debugging = false;
        this.animationFrame = requestAnimationFrame(this.run.bind(this));
        this.soundChip.setMuted(false);

        this.currentlyRunning = true;
    }

    lastTime = 0;
    run() {
        const now = performance.now();
        let deltaMs = now - this.lastTime;
        if (deltaMs > (1000 / 60)) deltaMs = (1000 / 60); // limit this for performance reasons
        this.lastTime = now;

        // We're not using 4194.304 here because that matches up to ~59.7275 FPS, not 60.
        let max = 4213.440 * deltaMs * this.speedMul;

        if (this.doubleSpeed === true) max <<= 1;

        let i = 0;
        while (i < max) {
            i += this.step();
        }

        if (this.stopNow == true) {
            this.stopNow = false;
        }

        this.animationFrame = requestAnimationFrame(this.run.bind(this));

        this.millisUntilMuteAudio = 100;
    }

    frame() {
        const cyclesToRun = this.doubleSpeed ? 70224 * 2 : 70224;
        for (let i = 0; i < cyclesToRun;) {
            i += this.step();
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

        this.cpuPausedTCyclesRemaining = 0;
        this.oamDmaCyclesRemaining = 0;

        this.until = 0;
        this.pending = 0;

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