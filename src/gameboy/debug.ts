
function test() {
    let cpu;

    cpu._r._f.zero = true;
    console.log(cpu._r.f);
    cpu._r.f = cpu._r.f;
    console.log(cpu._r.f);
    console.log("Expect both answers 128.");

    cpu._r.a = 100;
    cpu._r.b = 100;
    cpu.ADD_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("Expect 200.");

    cpu = new CPU();

    cpu._r.a = 200;
    cpu._r.b = 200;
    cpu.ADD_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log(cpu._r._f.carry);
    console.log("Expect 144 and carry bit.");

    cpu = new CPU();

    cpu._r.c = 200;
    cpu._r.hl = 256;
    cpu.ADD_HL_R8(R8.C);
    console.log(cpu._r.hl);
    console.log(cpu._r._f.carry);
    console.log("ADDHL: Expect 456 and no carry bit.");

    cpu = new CPU();

    cpu._r.hl = 42069;
    console.log(cpu._r.hl);
    console.log("setting HL: Expect 42069.");

    cpu._r.a = 20;
    cpu._r.b = 16;
    cpu.SUB_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("SUB 20 - 16: Expect 4.");

    cpu._r.a = 20;
    cpu._r.b = 160;
    cpu.SUB_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("SUB 20 - 160: Expect 116.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    cpu.AND_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 & 25: Expect (DEC) 8.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    cpu.OR_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 | 25: Expect (DEC) 29.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    cpu.XOR_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 ^ 25: Expect (DEC) 21.");

    cpu._r.a = 12;
    cpu.INC_R8(R8.A);
    console.log(cpu._r.a);
    console.log("INC A: Expect 13.");

    cpu._r.a = 12;
    cpu.DEC_R8(R8.A);
    console.log(cpu._r.a);
    console.log("DEC A: Expect 11.");

    cpu._r.a = 0b00001111;
    cpu._r.b = 0b00000001;
    cpu.ADD_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("Expect half carry.");

    cpu._r.h = 0b00010000;
    cpu.BIT_R8(R8.H, 7);
    console.log("Expect zero.");

    cpu = new CPU();
}




function startDebugging() {
    let debugP = document.getElementById('debug');
    // @ts-check
    if (!IS_NODE) {
        let lastFrameCount = 0;
        let fps = 0;

        setInterval(() => {
            let cpu = ((window as any).cpu as CPU);
            fps = cpu.bus.gpu.totalFrameCount - lastFrameCount;
            lastFrameCount = cpu.bus.gpu.totalFrameCount;
        }, 1000);
        setInterval(() => {
            let lastDebugText = "";
            let cpu = ((window as any).cpu as CPU);
            let r = cpu.bus.interrupts.requestedInterrupts;
            let e = cpu.bus.interrupts.enabledInterrupts;
            let debugText = `
                Total Instructions Executed: ${cpu.totalI}
                Total Cycles: ${cpu.cycles}

                IME/E/R: ${cpu.bus.interrupts.masterEnabled}/${e.vblank ? "V" : "-"}${e.lcdStat ? "L" : "-"}${e.timer ? "T" : "-"}${e.serial ? "S" : "-"}${e.joypad ? "J" : "-"} (${hex(e.numerical, 2)})/${r.vblank ? "V" : "-"}${r.lcdStat ? "L" : "-"}${r.timer ? "T" : "-"}${r.serial ? "S" : "-"}${r.joypad ? "J" : "-"} (${hex(r.numerical, 2)})

                PC: ${hex(cpu.pc, 4)}
                Flags: ${cpu._r._f.zero ? "Z" : "-"}${cpu._r._f.negative ? "N" : "-"}${cpu._r._f.half_carry ? "H" : "-"}${cpu._r._f.carry ? "C" : "-"}
        
                SP: ${hex(cpu._r.sp, 4)} ${cpu._r.sp} ${cpu._r.sp.toString(2)} [${hex(cpu.bus.readMem16(cpu._r.sp), 4)}]
                <span class="code">
                A: ${hex(cpu._r.a, 2)} ${pad(cpu._r.a.toString(2), 8, '0')}
                B: ${hex(cpu._r.b, 2)} ${pad(cpu._r.b.toString(2), 8, '0')}
                C: ${hex(cpu._r.c, 2)} ${pad(cpu._r.c.toString(2), 8, '0')}
                D: ${hex(cpu._r.d, 2)} ${pad(cpu._r.d.toString(2), 8, '0')}
                E: ${hex(cpu._r.e, 2)} ${pad(cpu._r.e.toString(2), 8, '0')}
                F: ${hex(cpu._r.f, 2)} ${pad(cpu._r.f.toString(2), 8, '0')}
                H: ${hex(cpu._r.h, 2)} ${pad(cpu._r.h.toString(2), 8, '0')}
                L: ${hex(cpu._r.l, 2)} ${pad(cpu._r.l.toString(2), 8, '0')}
            
                AF: ${hex(cpu._r.af, 4)} ${pad(cpu._r.af.toString(2), 16, '0')}
                BC: ${hex(cpu._r.bc, 4)} ${pad(cpu._r.bc.toString(2), 16, '0')}
                DE: ${hex(cpu._r.de, 4)} ${pad(cpu._r.de.toString(2), 16, '0')}
                HL: ${hex(cpu._r.hl, 4)} ${pad(cpu._r.hl.toString(2), 16, '0')}
                [HL]: ${hex(cpu.bus.readMem8(cpu._r.hl), 2)}
                </span>------------------------------
                Scroll X/Y: ${cpu.bus.gpu.scrollY}/${cpu.bus.gpu.scrollX}
                LCDC Y-Coordinate: ${cpu.bus.gpu.lcdcY} ${cpu.bus.gpu.lcdcY >= 144 ? "(Vblank)" : ""}

                LCDC: ${pad(cpu.bus.gpu.lcdControl.numerical.toString(2), 8, '0')}
                LCD Status: ${pad(cpu.bus.gpu.lcdStatus.numerical.toString(2), 7, '0')}

                Total Frames: ${cpu.bus.gpu.totalFrameCount}
                Frames Per Second: ${fps}
                ------------------------------
                Joypad: ${pad(cpu.bus.joypad.numerical.toString(2), 8, '0')}

                Serial Out: 
                <span class="code">${new TextDecoder().decode(new Uint8Array(cpu.bus.serialOut.slice(0, 2560)))}</span>
            `;

            

            let p0 = document.getElementById('palette0');
            let p1 = document.getElementById('palette1');
            let p2 = document.getElementById('palette2');
            let p3 = document.getElementById('palette3');

            p0.style.backgroundColor = hexN(transformColor(cpu.bus.gpu.bgPaletteData.shade0), 6);
            p1.style.backgroundColor = hexN(transformColor(cpu.bus.gpu.bgPaletteData.shade1), 6);
            p2.style.backgroundColor = hexN(transformColor(cpu.bus.gpu.bgPaletteData.shade2), 6);
            p3.style.backgroundColor = hexN(transformColor(cpu.bus.gpu.bgPaletteData.shade3), 6);

            debugText = debugText.replace(/\n/g, "<br/>");
            debugP.innerHTML = debugText;
        }, 100);
    } else {
        console.log("Running in node, not updating DEBUG");
    }
}
