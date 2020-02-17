
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
    cpu.ADD_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log("Expect 200.");

    cpu.reset();

    cpu._r.a = 200;
    cpu._r.b = 200;
    cpu.ADD_A_R8(R8.B);
    console.log(cpu._r.a);
    console.log(cpu._r._f.carry);
    console.log("Expect 144 and carry bit.");

    cpu.reset();

    cpu._r.c = 200;
    cpu._r.hl = 256;
    cpu.ADD_HL_R8(R8.C);
    console.log(cpu._r.hl);
    console.log(cpu._r._f.carry);
    console.log("ADDHL: Expect 456 and no carry bit.");

    cpu.reset();

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

    cpu.reset();
}




function startDebugging() {
    let debugP = document.getElementById('debug')!;
    // @ts-check
    if (!IS_NODE) {
        let lastFrameCount = 0;
        let fps = 0;

        setInterval(() => {
            let gpu = ((window as any).gb.gpu as GPU) 
            fps = gpu.totalFrameCount - lastFrameCount;
            lastFrameCount = gpu.totalFrameCount;
        }, 1000);
        setInterval(() => {
            let lastDebugText = "";
            let gb = ((window as any).gb as GameBoy)
            let cpu = ((window as any).cpu as CPU);
            let gpu = ((window as any).gb.gpu as GPU) 
            let displaySerial = (window as any).displaySerial;
            let r = cpu.gb.bus.interrupts.requestedInterrupts;
            let e = cpu.gb.bus.interrupts.enabledInterrupts;
            let debugText = `
                Control Flow: ${Disassembler.controlFlowDisassembly[0]}
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

                Timer Divider: ${gb.timer.addr_0xFF04}
                Timer Counter: ${gb.timer.addr_0xFF05}
                Timer Modulo: ${gb.timer.addr_0xFF06}
                Timer Config: ${gb.timer.addr_0xFF07}

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
                
            `;


            // A: ${hex(cpu._r.a, 2)} ${pad(cpu._r.a.toString(2), 8, '0')}
            // B: ${hex(cpu._r.b, 2)} ${pad(cpu._r.b.toString(2), 8, '0')}
            // C: ${hex(cpu._r.c, 2)} ${pad(cpu._r.c.toString(2), 8, '0')}
            // D: ${hex(cpu._r.d, 2)} ${pad(cpu._r.d.toString(2), 8, '0')}
            // E: ${hex(cpu._r.e, 2)} ${pad(cpu._r.e.toString(2), 8, '0')}
            // F: ${hex(cpu._r.f, 2)} ${pad(cpu._r.f.toString(2), 8, '0')}
            // H: ${hex(cpu._r.h, 2)} ${pad(cpu._r.h.toString(2), 8, '0')}
            // L: ${hex(cpu._r.l, 2)} ${pad(cpu._r.l.toString(2), 8, '0')}
        
            

            let p0 = document.getElementById('palette0')!;
            let p1 = document.getElementById('palette1')!;
            let p2 = document.getElementById('palette2')!;
            let p3 = document.getElementById('palette3')!;

            p0.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade0), 6);
            p1.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade1), 6);
            p2.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade2), 6);
            p3.style.backgroundColor = hexN(transformColor(gpu.bgPaletteData.shade3), 6);

            debugText = debugText.replace(/\n/g, "<br/>");
            debugP.innerHTML = debugText;
        }, 50);
    } else {
        console.log("Running in node, not updating DEBUG");
    }
}
