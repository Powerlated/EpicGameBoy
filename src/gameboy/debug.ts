
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
    // @ts-check
    if (!isNode()) {
        setInterval(() => {
            let cpu = (window as any).cpu;
            try {
                let debugP = document.getElementById('debug');
                debugP.innerText = `
    Last Instruction: [${cpu.lastInstructionDebug}] ${cpu.currentIns} (${cpu.lastOperandDebug})
    Last Instruction Cycles: ${cpu.lastInstructionCycles}

    Total Instructions Executed: ${cpu.totalI}
    Total Cycles: ${cpu.cycles}
    
    
    PC: ${hex(cpu.pc, 4)}

    CARRY: ${cpu._r._f.carry}
    HALF_CARRY: ${cpu._r._f.half_carry}
    SUBTRACT: ${cpu._r._f.negative}
    ZERO: ${cpu._r._f.zero}

      SP: ${hex(cpu._r.sp, 4)} ${cpu._r.sp} ${cpu._r.sp.toString(2)}
    [SP]: ${hex(cpu.bus.readMem16(cpu._r.sp), 4)}

    A: ${hex(cpu._r.a, 2)} ${cpu._r.a} ${cpu._r.a.toString(2)}
    B: ${hex(cpu._r.b, 2)} ${cpu._r.b} ${cpu._r.b.toString(2)}
    C: ${hex(cpu._r.c, 2)} ${cpu._r.c} ${cpu._r.c.toString(2)}
    D: ${hex(cpu._r.d, 2)} ${cpu._r.d} ${cpu._r.d.toString(2)}
    E: ${hex(cpu._r.e, 2)} ${cpu._r.e} ${cpu._r.e.toString(2)}
    H: ${hex(cpu._r.h, 2)} ${cpu._r.h} ${cpu._r.h.toString(2)}
    L: ${hex(cpu._r.l, 2)} ${cpu._r.l} ${cpu._r.l.toString(2)}

    BC: ${hex(cpu._r.bc, 4)} ${cpu._r.bc} ${cpu._r.bc.toString(2)}
    DE: ${hex(cpu._r.de, 4)} ${cpu._r.de} ${cpu._r.de.toString(2)}
    HL: ${hex(cpu._r.hl, 4)} ${cpu._r.hl} ${cpu._r.hl.toString(2)}
    `;
            } catch (e) {
                alert(`
        Error occurred in display, probably caused by error in CPU.
        
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}

        `);

                console.error(e);
                cpu.khzStop();
            }
        }, 100);



        let disassemblyP = document.getElementById('disassembly-output');
        setInterval(() => {
            let cpu: CPU = (window as any).cpu;
            disassemblyP.innerHTML = cpu.disassembly;
        }, 10);
    } else {
        console.log("Running in node, not updating DEBUG");
    }
}
