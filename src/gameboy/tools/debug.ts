import GameBoy from "../../../core/gameboy";
import GPU, { colors555 } from "../../../core/video/gpu";
import CPU, { R8, R16 } from "../../../core/cpu/cpu";
import { hex, pad, hexN } from "./util";

export const DebugSettings = {
    highlight: 0
};


export function startDebugging() {
    const debugP = document.getElementById('debug')!;
    // @ts-check
    let lastFrameCount = 0;
    let lastCyclesCount = 0;

    let t0 = 0;
    let t1 = 0;

    setInterval(() => {
        const diff = t1 - t0;
        t0 = t1;
        t1 = performance.now();

        const gb = ((window as any).gb as GameBoy);

        const cpu = gb.cpu;
        const gpu = gb.gpu;

        let pct = (cpu.cycles - lastCyclesCount) / 4213520.36499 * 100;
        if (gb.doubleSpeed) pct /= 2;

        const speed = Math.round(pct);
        lastFrameCount = gpu.totalFrameCount;

        document.title = `Optime GB (${speed}%)`;

        (window as any).fps = Math.round(((cpu.cycles - lastCyclesCount) / 4213520.36499) * 60);
        (window as any).cyclesPerSecond = Math.round((cpu.cycles - lastCyclesCount) / (diff / 1000));
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
    const cpu = ((window as any).gb.cpu as CPU);
    const fps = (window as any).fps;
    const cyclesPerSecond = (window as any).cyclesPerSecond;
    const gpu = ((window as any).gb.gpu as GPU);
    const displaySerial = (window as any).displaySerial;
    const r = gb.interrupts.requested;
    const e = gb.interrupts.enabled;
    let debugText =
        `
                Total Instructions Executed: ${cpu.totalI}
                Total Cycles: ${cpu.cycles}
                Cycles Per Second: ${cyclesPerSecond}

                Halted: ${cpu.halted}

                IME/E/R: ${gb.interrupts.masterEnabled}/${e.vblank ? "V" : "-"}${e.lcdStat ? "L" : "-"}${e.timer ? "T" : "-"}${e.serial ? "S" : "-"}${e.joypad ? "J" : "-"} (${hex(e.numerical, 2)})/${r.vblank ? "V" : "-"}${r.lcdStat ? "L" : "-"}${r.timer ? "T" : "-"}${r.serial ? "S" : "-"}${r.joypad ? "J" : "-"} (${hex(r.numerical, 2)})

                PC: ${hex(cpu.pc, 4)}
                Flags: ${cpu.reg._f.zero ? "Z" : "-"}${cpu.reg._f.negative ? "N" : "-"}${cpu.reg._f.half_carry ? "H" : "-"}${cpu.reg._f.carry ? "C" : "-"}
        
                <span class="code">
                SP: ${hex(cpu.reg.sp, 4)} ${cpu.reg.sp.toString(2)} [${hex(gb.bus.readMem16(cpu.reg.sp), 4)}]

                AF: ${hex(cpu.reg[R16.AF], 4)} ${pad(cpu.reg[R8.A].toString(2), 8, '0')} ${pad(cpu.reg.f.toString(2), 8, '0')} 
                BC: ${hex(cpu.reg[R16.BC], 4)} ${pad(cpu.reg[R8.B].toString(2), 8, '0')} ${pad(cpu.reg[R8.C].toString(2), 8, '0')}
                DE: ${hex(cpu.reg[R16.DE], 4)} ${pad(cpu.reg[R8.D].toString(2), 8, '0')} ${pad(cpu.reg[R8.E].toString(2), 8, '0')}
                HL: ${hex(cpu.reg[R16.HL], 4)} ${pad(cpu.reg[R8.H].toString(2), 8, '0')} ${pad(cpu.reg[R8.L].toString(2), 8, '0')}
                [HL]: ${hex(gb.bus.read(cpu.reg[R16.HL]), 2)}
                </span>------------------------------
                Scroll X/Y: ${gpu.scrX}/${gpu.scrY}
                Window X/Y: ${gpu.windowXpos}/${gpu.windowYpos}
                LCDC Y-Coordinate: ${gpu.lY} ${gpu.lY >= 144 ? "(Vblank)" : ""}

                LCDC: ${pad(gpu.lcdControl.getNumerical().toString(2), 8, '0')}
                LCD Status: ${pad(gpu.lcdStatus.getNumerical().toString(2), 7, '0')}

                Total Frames: ${gpu.totalFrameCount}
                Frames Per Second: ${fps}
                ------------------------------
                Joypad: ${pad(gb.joypad.getNumerical().toString(2), 8, '0')}

                Serial Out: 
                <span class="code">${displaySerial ? new TextDecoder().decode(new Uint8Array(gb.bus.serialOut.slice(0, 2560))) : ""}</span>
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