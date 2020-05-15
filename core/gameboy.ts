import CPU from './cpu/cpu';
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
import { R16 } from './cpu/cpu_types';
import { hex } from '../src/gameboy/tools/util';
import { bitSetValue, bitGet } from './bit_constants';
import { Serializer, PUT_8, GET_8, PUT_BOOL, GET_BOOL, PUT_16LE } from './serialize';

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
    soundChip = new SoundChip(this);
    timer = new Timer(this);

    cgb = false;
    doubleSpeedShift = 1;
    prepareSpeedSwitch = false;


    speedMul = 1;
    speedIntervals: Array<number> = [];
    currentlyRunning = false;
    animationFrame = 0;
    millisUntilMuteAudio = 0;

    step(): number {
        return this.cpu.execute();
    }

    tick(cyclesRan: number) {
        // Timer runs at double speed as well, so use the unmodified value for timer
        this.timer.tick(cyclesRan);
        // The APU is ticked by the timer so it's the timer class
        this.gpu.tick(cyclesRan >> this.doubleSpeedShift);
        this.dma.tick(cyclesRan);
    }

    speedStop() {
        cancelAnimationFrame(this.animationFrame);
        this.soundChip.setMuted(true);
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

        if (this.doubleSpeedShift) max <<= 1;

        let i = 0;
        if (this.cpu.enableBreakpoints) {
            while (i < max) {
                if (this.cpu.breakpoints[this.cpu.pc] === true) {
                    this.speedStop();
                    return;
                }
                i += this.step();
            }
        } else {
            while (i < max) {
                i += this.step();
            }
        }

        this.animationFrame = requestAnimationFrame(this.run.bind(this));

        this.millisUntilMuteAudio = 100;
    }

    frame() {
        const cyclesToRun = this.doubleSpeedShift ? 70224 * 2 : 70224;
        for (let i = 0; i < cyclesToRun;) {
            i += this.step();
        }
    }

    state: Serializer = new Serializer();

    serialize() {
        this.state = new Serializer();
        const state = this.state;
        
        state.resetPos();

        PUT_8(state, this.doubleSpeedShift);
        PUT_BOOL(state, this.cgb);
        PUT_BOOL(state, this.prepareSpeedSwitch);

        this.bus.serialize(state);
        this.cpu.serialize(state);
        this.gpu.serialize(state);
    }

    deserialize() {
        const state = this.state;

        state.resetPos();

        this.doubleSpeedShift = GET_8(state);
        this.cgb = GET_BOOL(state);
        this.prepareSpeedSwitch = GET_BOOL(state);

        this.bus.deserialize(state);
        this.cpu.deserialize(state);
        this.gpu.deserialize(state);

    }

    reset() {
        this.cpu.reset();
        this.gpu.reset();
        this.interrupts.reset();
        this.bus.reset();
        this.timer.reset();
        this.soundChip.reset();
        this.dma.reset();

        this.doubleSpeedShift = 0;
        this.prepareSpeedSwitch = false;

        // console.log("No bootrom is loaded, starting execution at 0x100 with proper values loaded");
        this.cpu.pc = 0x100;

        // Games check A for 0x11 to detect a CGB
        if (this.cgb) {
            this.cpu.reg[R16.AF] = 0x1180;
            this.cpu.reg[R16.BC] = 0x0000;
            this.cpu.reg[R16.DE] = 0xFF56;
            this.cpu.reg[R16.HL] = 0x000D;
            this.cpu.reg.sp = 0xFFFE;
        } else {
            this.dmgBootrom();
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

    dmgBootrom() {
        this.cpu.reg[R16.AF] = 0x01B0;
        this.cpu.reg[R16.BC] = 0x0013;
        this.cpu.reg[R16.DE] = 0x00D8;
        this.cpu.reg[R16.HL] = 0x014D;
        this.cpu.reg.sp = 0xFFFE;

        // Clear VRAM
        const vramPointer = 0x8000;
        for (let i = 0; i < 0x2000; i++) {
            this.bus.write(vramPointer + i, 0);
        }

        // Set palette
        this.bus.write(0xFF47, 0xFC);

        // Reset scroll registers
        this.gpu.scrX = 0;
        this.gpu.scrY = 0;


        // Copy Nintendo logo from cartridge
        let logoData = new Uint8Array(48);
        const base = 0x104;
        for (let i = 0; i < 48; i++) {
            let byte = this.bus.ext.romData[0][base + i];
            logoData[i] = byte;
        }

        // Put copyright symbol into tile data
        let copyrightSymbol = Uint8Array.of(0x3C, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x3C);
        const copyrightPointer = 0x8190;
        for (let i = 0; i < 8; i++) {
            this.bus.write(copyrightPointer + (i * 2) + 0, copyrightSymbol[i]);
            this.bus.write(copyrightPointer + (i * 2) + 1, copyrightSymbol[i]);
        }

        // Write Nintendo logo tile map
        const row1Pointer = 0x9904;
        const row2Pointer = 0x9924;
        for (let i = 0; i < 12; i++) {
            this.bus.write(row1Pointer + i, i + 0x1);
            this.bus.write(row2Pointer + i, i + 0xD);
        }

        // Expand Nintendo logo tile data
        let logoTilesPointer = 0x8010;
        for (let i = 0; i < 48; i++) {
            let dataByte = logoData[i];
            let upper = dataByte >> 4;
            let lower = dataByte & 0xF;

            let lowerFull = 0;
            let upperFull = 0;
            for (let j = 0; j < 8; j++) {
                lowerFull = bitSetValue(lowerFull, j, bitGet(lower, j >> 1));
                upperFull = bitSetValue(upperFull, j, bitGet(upper, j >> 1));
            }

            for (let j = 0; j < 4; j++) {
                this.bus.write(logoTilesPointer + (i * 8) + j + 0, upperFull);
                this.bus.write(logoTilesPointer + (i * 8) + j + 3, lowerFull);
            }
        }

        // Tile for copyright symbol
        this.bus.write(0x9910, 0x19);

        // Turn on the LCD, enable Background, use Tileset 0x8000, 
        this.bus.write(0xFF40, 0x91);
        this.bus.write(0xFF0F, 0xE1);

        this.timer.internal = 0xABC8;
    }
}

export { GameBoy, CPU, GPU, MemoryBus, Timer, Disassembler }; 