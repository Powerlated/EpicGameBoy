import GameBoy from "../../../core/gameboy";
import Ops from "../../../core/cpu/cpu_ops";
import GPU, { colors555 } from "../../../core/video/gpu";
import CPU, { R8 } from "../../../core/cpu/cpu";
import { hex, pad, hexN } from "./util";

function test() {
    const gb = new GameBoy(false);
    const cpu = gb.cpu;

    cpu._r._f.zero = true;
    writeDebug(cpu._r.f);
    cpu._r.f = cpu._r.f;
    writeDebug(cpu._r.f);
    writeDebug("Expect both answers 128.");

    cpu._r.a = 100;
    cpu._r.b = 100;
    Ops.ADD_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("Expect 200.");

    cpu.reset();

    cpu._r.a = 200;
    cpu._r.b = 200;
    Ops.ADD_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug(cpu._r._f.carry);
    writeDebug("Expect 144 and carry bit.");

    cpu.reset();

    cpu._r.c = 200;
    cpu._r.hl = 256;
    Ops.ADD_HL_R8(cpu, R8.C);
    writeDebug(cpu._r.hl);
    writeDebug(cpu._r._f.carry);
    writeDebug("ADDHL: Expect 456 and no carry bit.");

    cpu.reset();

    cpu._r.hl = 42069;
    writeDebug(cpu._r.hl);
    writeDebug("setting HL: Expect 42069.");

    cpu._r.a = 20;
    cpu._r.b = 16;
    Ops.SUB_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("SUB 20 - 16: Expect 4.");

    cpu._r.a = 20;
    cpu._r.b = 160;
    Ops.SUB_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("SUB 20 - 160: Expect 116.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    Ops.AND_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("(DEC) 12 & 25: Expect (DEC) 8.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    Ops.OR_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("(DEC) 12 | 25: Expect (DEC) 29.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    Ops.XOR_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("(DEC) 12 ^ 25: Expect (DEC) 21.");

    cpu._r.a = 12;
    Ops.INC_R8(cpu, R8.A);
    writeDebug(cpu._r.a);
    writeDebug("INC A: Expect 13.");

    cpu._r.a = 12;
    Ops.DEC_R8(cpu, R8.A);
    writeDebug(cpu._r.a);
    writeDebug("DEC A: Expect 11.");

    cpu._r.a = 0b00001111;
    cpu._r.b = 0b00000001;
    Ops.ADD_A_R8(cpu, R8.B);
    writeDebug(cpu._r.a);
    writeDebug("Expect half carry.");

    cpu._r.h = 0b00010000;
    Ops.BIT_R8(cpu, R8.H, 7);
    writeDebug("Expect zero.");

    cpu.reset();
}

export const DebugSettings = {
    highlight: 0
};


export function startDebugging() {
    const debugP = document.getElementById('debug')!;
    // @ts-check
    let lastFrameCount = 0;
    let lastCyclesCount = 0;

    setInterval(() => {
        const gpu = ((window as any).gb.gpu as GPU);
        (window as any).fps = gpu.totalFrameCount - lastFrameCount;
        lastFrameCount = gpu.totalFrameCount;
    }, 1000);

    setInterval(() => {
        const cpu = ((window as any).gb.cpu as CPU);
        (window as any).cyclesPerSecond = cpu.cycles - lastCyclesCount;
        lastCyclesCount = cpu.cycles;
    }, 1000);

    updateDebug();
}

const p0bg = document.getElementById('palette0-bg')!;
const p1bg = document.getElementById('palette1-bg')!;
const p2bg = document.getElementById('palette2-bg')!;
const p3bg = document.getElementById('palette3-bg')!;

const p0obj0 = document.getElementById('palette0-obj0')!;
const p1obj0 = document.getElementById('palette1-obj0')!;
const p2obj0 = document.getElementById('palette2-obj0')!;
const p3obj0 = document.getElementById('palette3-obj0')!;

const p0obj1 = document.getElementById('palette0-obj1')!;
const p1obj1 = document.getElementById('palette1-obj1')!;
const p2obj1 = document.getElementById('palette2-obj1')!;
const p3obj1 = document.getElementById('palette3-obj1')!;

const memoryMapImg = new ImageData(new Uint8ClampedArray(256 * 256 * 4), 256, 256);

const cMemoryMap = document.getElementById("memory-map") as HTMLCanvasElement;
const ctxMemoryMap = cMemoryMap.getContext("2d")!;

function updateDebug() {
    requestAnimationFrame(updateDebug);
    if ((window as any).globalDebug === false) return;
    const debugP = document.getElementById('debug')!;
    const lastDebugText = "";
    const gb = ((window as any).gb as GameBoy);
    const cpu = ((window as any).cpu as CPU);
    const fps = (window as any).fps;
    const cyclesPerSecond = (window as any).cyclesPerSecond;
    const gpu = ((window as any).gb.gpu as GPU);
    const displaySerial = (window as any).displaySerial;
    const r = cpu.gb.interrupts.requested;
    const e = cpu.gb.interrupts.enabled;
    let debugText =
        `
                Total Instructions Executed: ${cpu.totalI}
                Total Cycles: ${cpu.cycles}
                Cycles Per Second: ${cyclesPerSecond}

                Halted: ${cpu.halted}

                IME/E/R: ${cpu.gb.interrupts.masterEnabled}/${e.vblank ? "V" : "-"}${e.lcdStat ? "L" : "-"}${e.timer ? "T" : "-"}${e.serial ? "S" : "-"}${e.joypad ? "J" : "-"} (${hex(e.numerical, 2)})/${r.vblank ? "V" : "-"}${r.lcdStat ? "L" : "-"}${r.timer ? "T" : "-"}${r.serial ? "S" : "-"}${r.joypad ? "J" : "-"} (${hex(r.numerical, 2)})

                PC: ${hex(cpu.pc, 4)}
                Flags: ${cpu._r._f.zero ? "Z" : "-"}${cpu._r._f.negative ? "N" : "-"}${cpu._r._f.half_carry ? "H" : "-"}${cpu._r._f.carry ? "C" : "-"}
        
                SP: ${hex(cpu._r.sp, 4)} ${cpu._r.sp} ${cpu._r.sp.toString(2)} [${hex(cpu.gb.bus.readMem16(cpu._r.sp), 4)}]
                <span class="code">
                AF: ${hex(cpu._r.af, 4)} ${pad(cpu._r.a.toString(2), 8, '0')} ${pad(cpu._r.f.toString(2), 8, '0')} 
                BC: ${hex(cpu._r.bc, 4)} ${pad(cpu._r.b.toString(2), 8, '0')} ${pad(cpu._r.c.toString(2), 8, '0')}
                DE: ${hex(cpu._r.de, 4)} ${pad(cpu._r.d.toString(2), 8, '0')} ${pad(cpu._r.e.toString(2), 8, '0')}
                HL: ${hex(cpu._r.hl, 4)} ${pad(cpu._r.h.toString(2), 8, '0')} ${pad(cpu._r.l.toString(2), 8, '0')}
                [HL]: ${hex(cpu.gb.bus.readMem8(cpu._r.hl), 2)}
                </span>------------------------------
                Scroll X/Y: ${gpu.scrX}/${gpu.scrY}
                Window X/Y: ${gpu.windowXpos}/${gpu.windowYpos}
                LCDC Y-Coordinate: ${gpu.lcdcY} ${gpu.lcdcY >= 144 ? "(Vblank)" : ""}

                LCDC: ${pad(gpu.lcdControl.numerical.toString(2), 8, '0')}
                LCD Status: ${pad(gpu.lcdStatus.numerical.toString(2), 7, '0')}

                Total Frames: ${gpu.totalFrameCount}
                Frames Per Second: ${fps}
                ------------------------------
                Joypad: ${pad(cpu.gb.bus.joypad.numerical.toString(2), 8, '0')}

                Serial Out: 
                <span class="code">${displaySerial ? new TextDecoder().decode(new Uint8Array(cpu.gb.bus.serialOut.slice(0, 2560))) : ""}</span>
                ------------------------------
                Pulse 1 Frequency: ${gb.soundChip.pulse1.frequencyHz}
                Pulse 2 Frequency: ${gb.soundChip.pulse2.frequencyHz}
                Wave Frequency:${gb.soundChip.wave.frequencyHz}
                Pulse 1 Volume: ${gb.soundChip.pulse1.volume}
                Pulse 2 Volume: ${gb.soundChip.pulse2.volume}
                Wave Volume:${gb.soundChip.wave.volume}
                Pulse 1 Envelope: ${gb.soundChip.pulse1.volumeEnvelopeSweep}
                Pulse 2 Envelope: ${gb.soundChip.pulse2.volumeEnvelopeSweep}
            `;


    // Timer: ${gb.timer.addr_0xFF04}
    // // Timer Counter: ${gb.timer.addr_0xFF05}
    // // Timer Modulo: ${gb.timer.addr_0xFF06}
    // Timer Config: ${gb.timer.addr_0xFF07}

    // A: ${hex(cpu._r.a, 2)} ${pad(cpu._r.a.toString(2), 8, '0')}
    // B: ${hex(cpu._r.b, 2)} ${pad(cpu._r.b.toString(2), 8, '0')}
    // C: ${hex(cpu._r.c, 2)} ${pad(cpu._r.c.toString(2), 8, '0')}
    // D: ${hex(cpu._r.d, 2)} ${pad(cpu._r.d.toString(2), 8, '0')}
    // E: ${hex(cpu._r.e, 2)} ${pad(cpu._r.e.toString(2), 8, '0')}
    // F: ${hex(cpu._r.f, 2)} ${pad(cpu._r.f.toString(2), 8, '0')}
    // H: ${hex(cpu._r.h, 2)} ${pad(cpu._r.h.toString(2), 8, '0')}
    // L: ${hex(cpu._r.l, 2)} ${pad(cpu._r.l.toString(2), 8, '0')}

    function c(i: Uint8Array) {
        return i[0] | (i[1] << 8) | (i[2] << 16);
    }

    // p0bg.style.backgroundColor = hexN(c(colors[gpu.bgPaletteData.shades[0]]), 6);
    // p1bg.style.backgroundColor = hexN(c(colors[gpu.bgPaletteData.shades[1]]), 6);
    // p2bg.style.backgroundColor = hexN(c(colors[gpu.bgPaletteData.shades[2]]), 6);
    // p3bg.style.backgroundColor = hexN(c(colors[gpu.bgPaletteData.shades[3]]), 6);

    // p0obj0.style.backgroundColor = hexN(c(colors[gpu.objPaletteData0.shades[0]]), 6);
    // p1obj0.style.backgroundColor = hexN(c(colors[gpu.objPaletteData0.shades[1]]), 6);
    // p2obj0.style.backgroundColor = hexN(c(colors[gpu.objPaletteData0.shades[2]]), 6);
    // p3obj0.style.backgroundColor = hexN(c(colors[gpu.objPaletteData0.shades[3]]), 6);

    // p0obj1.style.backgroundColor = hexN(c(colors[gpu.objPaletteData1.shades[0]]), 6);
    // p1obj1.style.backgroundColor = hexN(c(colors[gpu.objPaletteData1.shades[1]]), 6);
    // p2obj1.style.backgroundColor = hexN(c(colors[gpu.objPaletteData1.shades[2]]), 6);
    // p3obj1.style.backgroundColor = hexN(c(colors[gpu.objPaletteData1.shades[3]]), 6);

    debugText = debugText.replace(/\n/g, "<br/>");
    debugP.innerHTML = debugText;

    // for (const y = 0; y < 256; y++) {
    //     for (const x = 0; x < 256; x++) {
    //         const c = gb.bus.readMem8((y * 256) + x);

    //         // Canvas Index
    //         const ci = ((y * 256) + x) * 4;

    //         memoryMapImg.data[ci + 0] = c;
    //         memoryMapImg.data[ci + 1] = c;
    //         memoryMapImg.data[ci + 2] = c;
    //         memoryMapImg.data[ci + 3] = 0xFF;
    //     }
    // }

    // const data = new ImageData(memoryMapImg.data, 256, 256);
    // ctxMemoryMap.putImageData(data, 0, 0);
}

export const logDebug = false;

export function writeDebug(any: any) {
    if (logDebug)
        console.log(any);
}