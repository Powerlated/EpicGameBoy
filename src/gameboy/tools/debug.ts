import GameBoy from "../gameboy";
import Ops from "../core/cpu_ops";
import GPU, { transformColor } from "../core/gpu";
import CPU, { R8, hex, pad, hexN } from "../core/cpu";

function test() {
    let gb = new GameBoy();
    let cpu = gb.cpu;

    cpu._r._f.zero = true;
    console.log(cpu._r.f);
    cpu._r.f = cpu._r.f;
    console.log(cpu._r.f);
    console.log("Expect both answers 128.");

    cpu._r.a = 100;
    cpu._r.b = 100;
    Ops.ADD_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("Expect 200.");

    cpu.reset();

    cpu._r.a = 200;
    cpu._r.b = 200;
    Ops.ADD_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log(cpu._r._f.carry);
    console.log("Expect 144 and carry bit.");

    cpu.reset();

    cpu._r.c = 200;
    cpu._r.hl = 256;
    Ops.ADD_HL_R8(cpu, R8.C);
    console.log(cpu._r.hl);
    console.log(cpu._r._f.carry);
    console.log("ADDHL: Expect 456 and no carry bit.");

    cpu.reset();

    cpu._r.hl = 42069;
    console.log(cpu._r.hl);
    console.log("setting HL: Expect 42069.");

    cpu._r.a = 20;
    cpu._r.b = 16;
    Ops.SUB_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("SUB 20 - 16: Expect 4.");

    cpu._r.a = 20;
    cpu._r.b = 160;
    Ops.SUB_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("SUB 20 - 160: Expect 116.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    Ops.AND_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 & 25: Expect (DEC) 8.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    Ops.OR_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 | 25: Expect (DEC) 29.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    Ops.XOR_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 ^ 25: Expect (DEC) 21.");

    cpu._r.a = 12;
    Ops.INC_R8(cpu, R8.A);
    console.log(cpu._r.a);
    console.log("INC A: Expect 13.");

    cpu._r.a = 12;
    Ops.DEC_R8(cpu, R8.A);
    console.log(cpu._r.a);
    console.log("DEC A: Expect 11.");

    cpu._r.a = 0b00001111;
    cpu._r.b = 0b00000001;
    Ops.ADD_A_R8(cpu, R8.B);
    console.log(cpu._r.a);
    console.log("Expect half carry.");

    cpu._r.h = 0b00010000;
    Ops.BIT_R8(cpu, R8.H, 7);
    console.log("Expect zero.");

    cpu.reset();
}


function startDebugging() {
    let debugP = document.getElementById('debug')!;
    // @ts-check
    if (!IS_NODE) {
        let lastFrameCount = 0;
        let fps = 0;

        setInterval(() => {
            let gpu = ((window as any).gb.gpu as GPU);
            (window as any).fps = gpu.totalFrameCount - lastFrameCount;
            lastFrameCount = gpu.totalFrameCount;
        }, 1000);


        updateDebug();
    } else {
        console.log("Running in node, not updating DEBUG");
    }
}

let p0bg = document.getElementById('palette0-bg')!;
let p1bg = document.getElementById('palette1-bg')!;
let p2bg = document.getElementById('palette2-bg')!;
let p3bg = document.getElementById('palette3-bg')!;

let p0obj0 = document.getElementById('palette0-obj0')!;
let p1obj0 = document.getElementById('palette1-obj0')!;
let p2obj0 = document.getElementById('palette2-obj0')!;
let p3obj0 = document.getElementById('palette3-obj0')!;

let p0obj1 = document.getElementById('palette0-obj1')!;
let p1obj1 = document.getElementById('palette1-obj1')!;
let p2obj1 = document.getElementById('palette2-obj1')!;
let p3obj1 = document.getElementById('palette3-obj1')!;

let memoryMapData = new Uint8ClampedArray(256 * 256 * 4);

let cMemoryMap = document.getElementById("memory-map") as HTMLCanvasElement;
let ctxMemoryMap = cMemoryMap.getContext("2d")!;

let div = 0;

export function updateDebug() {
    requestAnimationFrame(updateDebug);
    if ((window as any).globalDebug == false) return;
    if (div < 2) {
        div++;
        return;
    } else {
        div = 0;
    }
    let debugP = document.getElementById('debug')!;
    let lastDebugText = "";
    let gb = ((window as any).gb as GameBoy);
    let cpu = ((window as any).cpu as CPU);
    let fps = (window as any).fps;
    let gpu = ((window as any).gb.gpu as GPU);
    let displaySerial = (window as any).displaySerial;
    let r = cpu.gb.bus.interrupts.requestedInterrupts;
    let e = cpu.gb.bus.interrupts.enabledInterrupts;
    let debugText =
        `
                Total Instructions Executed: ${cpu.totalI}
                Total Cycles: ${cpu.cycles}

                Halted: ${cpu.halted}

                IME/E/R: ${cpu.gb.bus.interrupts.masterEnabled}/${e.vblank ? "V" : "-"}${e.lcdStat ? "L" : "-"}${e.timer ? "T" : "-"}${e.serial ? "S" : "-"}${e.joypad ? "J" : "-"} (${hex(e.numerical, 2)})/${r.vblank ? "V" : "-"}${r.lcdStat ? "L" : "-"}${r.timer ? "T" : "-"}${r.serial ? "S" : "-"}${r.joypad ? "J" : "-"} (${hex(r.numerical, 2)})

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
                Scroll X/Y: ${gpu.scrollY}/${gpu.scrollX}
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
                Pulse 1 Frequency: ${gb.soundChip.pulseChannel1.frequencyHz}
                Pulse 2 Frequency: ${gb.soundChip.pulseChannel2.frequencyHz}
                Wave Frequency:${gb.soundChip.waveChannel.frequencyHz}
                Pulse 1 Volume: ${gb.soundChip.pulseChannel1.volume}
                Pulse 2 Volume: ${gb.soundChip.pulseChannel2.volume}
                Wave Volume:${gb.soundChip.waveChannel.volume}
                Pulse 1 Envelope: ${gb.soundChip.pulseChannel1.volumeEnvelopeSweep}
                Pulse 2 Envelope: ${gb.soundChip.pulseChannel2.volumeEnvelopeSweep}
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


    p0bg.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade0), 6);
    p1bg.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade1), 6);
    p2bg.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade2), 6);
    p3bg.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade3), 6);

    p0obj0.style.backgroundColor = hexN(transformColor(gpu.objPaletteData0.shade0), 6);
    p1obj0.style.backgroundColor = hexN(transformColor(gpu.objPaletteData0.shade1), 6);
    p2obj0.style.backgroundColor = hexN(transformColor(gpu.objPaletteData0.shade2), 6);
    p3obj0.style.backgroundColor = hexN(transformColor(gpu.objPaletteData0.shade3), 6);

    p0obj1.style.backgroundColor = hexN(transformColor(gpu.objPaletteData1.shade0), 6);
    p1obj1.style.backgroundColor = hexN(transformColor(gpu.objPaletteData1.shade1), 6);
    p2obj1.style.backgroundColor = hexN(transformColor(gpu.objPaletteData1.shade2), 6);
    p3obj1.style.backgroundColor = hexN(transformColor(gpu.objPaletteData1.shade3), 6);

    debugText = debugText.replace(/\n/g, "<br/>");
    debugP.innerHTML = debugText;

    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            let c = gb.bus.readMem8((y * 256) + x);

            // Canvas Index
            let ci = ((y * 256) + x) * 4;

            memoryMapData[ci + 0] = c;
            memoryMapData[ci + 1] = c;
            memoryMapData[ci + 2] = c;
            memoryMapData[ci + 3] = 0xFF;
        }
    }

    let data = new ImageData(memoryMapData, 256, 256);
    ctxMemoryMap.putImageData(data, 0, 0);
}

let globalDebug = false;