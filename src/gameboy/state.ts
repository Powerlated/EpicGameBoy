import GameBoy from './gameboy';
import * as pako from 'pako';
import { writeDebug } from './tools/debug';

type State = {
    cpu: {
        pc: number;

        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
        h: number;
        l: number;

        cycles: number;
        halted: boolean;

        scheduleEnableInterruptsForNextTick: boolean;
    },
    memory: {
        bootromEnabled: boolean;
        bootromLoaded: boolean;

        bootrom: Array<number>;
        memory: Array<number>;

        ext: {

        }
    },
    gpu: {
        totalFrameCount: number;

        oam: Array<number>;
        vram: Array<number>;

        tileset: Array<Array<Array<number>>>;

        lcdControl: number;
        lcdStatus: number;

        bgPaletteData: number;
        objPaletteData0: number;
        objPaletteData1: number;

        scrollY: number;
        scrollX: number;

        windowYpos: number;
        windowXpos: number;

        lcdcY: number;

        modeClock: number;
        frameClock: number;
    },
    timer: {
        divider: number;
        counter: number;
        modulo: number;
        control: {
            speed: number;
            running: boolean;
        };
        c: {
            clock: number;
            divClock: number;
            mainClock: number;
        };
    };
};

function SaveState(gb: GameBoy, slot: number) {
    let gpu = gb.gpu;
    let cpu = gb.cpu;
    let timer = gb.timer;
    let bus = gb.bus;

    let state: State = {
        cpu: {
            pc: cpu.pc,

            a: cpu._r.a,
            b: cpu._r.a,
            c: cpu._r.a,
            d: cpu._r.a,
            e: cpu._r.a,
            f: cpu._r.a,
            h: cpu._r.a,
            l: cpu._r.a,

            cycles: cpu.cycles,
            halted: cpu.halted,

            scheduleEnableInterruptsForNextTick: cpu.scheduleEnableInterruptsForNextTick
        },
        gpu: {
            totalFrameCount: gpu.totalFrameCount,

            oam: Array.from(gpu.oam),
            vram: Array.from(gpu.vram),

            tileset: gpu.tileset,

            lcdControl: gpu.lcdControl.numerical,
            lcdStatus: gpu.lcdStatus.numerical,

            bgPaletteData: gpu.bgPaletteData.numerical,
            objPaletteData0: gpu.objPaletteData0.numerical,
            objPaletteData1: gpu.objPaletteData1.numerical,

            scrollY: gpu.scrY,
            scrollX: gpu.scrX,

            windowYpos: gpu.windowYpos,
            windowXpos: gpu.windowXpos,

            lcdcY: gpu.lcdcY,

            modeClock: gpu.modeClock,
            frameClock: gpu.frameClock,
        },
        memory: {
            bootromEnabled: bus.bootromEnabled,
            bootromLoaded: bus.bootromLoaded,

            bootrom: Array.from(bus.bootrom),
            memory: Array.from(bus.memory),

            ext: {
                mbc: bus.ext.mbc.constructor.name,
            }
        },
        timer: {
            divider: timer.divider,
            counter: timer.counter,
            modulo: timer.modulo,
            control: {
                speed: timer.control.speed,
                running: timer.control.running,
            },
            c: {
                clock: timer.c.clock,
                divClock: timer.c.divClock,
                mainClock: timer.c.mainClock
            }
        }
    };

    let data = pako.deflate(JSON.stringify(state), { level: 9 });
    localStorage[`savestate-${slot}`] = btoa(String.fromCharCode(...data));
}

function LoadState(gb: GameBoy, slot: number) {
    let data = pako.inflate(Uint8Array.from(localStorage[`savestate-${slot}`]));

    let state = JSON.parse(String.fromCharCode(...data));

    writeDebug(state);
}