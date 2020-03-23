import MBC, { MBCWithRAM } from "./mbc/mbc";

import NullMBC from "./mbc/nullmbc";
import MBC1 from "./mbc/mbc1";
import MBC3 from "./mbc/mbc3";
import MBC5 from "./mbc/mbc5";
import GameBoy from "../gameboy";
import { loadSram, saveSram } from "../../src/gameboy/localstorage";

export default class ExternalBus {
    mbc: MBC | MBCWithRAM;
    romBanks = 0;
    rom = new Uint8Array(4194304).fill(0xFF);
    gb: GameBoy;

    romTitle: string = "";

    constructor(gb: GameBoy) {
        this.gb = gb;
        this.mbc = new NullMBC(this);
    }

    read(addr: number): number {
        return this.mbc.read(addr);
    }

    write(addr: number, value: number) {
        this.mbc.write(addr, value);
    }

    replaceRom(rom: Uint8Array) {
        console.info("Replaced ROM");
        this.rom.forEach((v, i, a) => {
            a[i] = 0;
        });
        rom.forEach((v, i) => {
            this.rom[i] = v;
        });
        this.updateMBC();

        const title = this.rom.slice(0x134, 0x143);
        const titleDecoded = new TextDecoder("utf-8").decode(title);
        console.log(titleDecoded);

        this.romTitle = titleDecoded;

        this.gb.cgb = (this.rom[0x143] & 0x80) !== 0 || this.rom[0x143] == 0xC0;
        this.gb.reset();

        const m = this.mbc as MBCWithRAM;
        if (m instanceof MBCWithRAM) {
            const sram = loadSram(this.romTitle);
            if (sram) {
                m.externalRam.forEach((v, i, a) => {
                    a[i] = 0;
                });
                sram.forEach((v: number, i: number) => {
                    m.externalRam[i] = v;
                });
                console.log(`Loaded SRAM for "${this.romTitle}"`);
            } else {
                console.log("Did not find save, not loading SRAM.");
            }
        }
    }

    saveGameSram() {
        const m = this.mbc as MBCWithRAM;
        if (m instanceof MBCWithRAM && m.externalRamDirtyBytes > 0) {
            console.log(`Flushing SRAM: ${m.externalRamDirtyBytes} dirty bytes`);
            saveSram(this.romTitle, m.externalRam);
            m.externalRamDirtyBytes = 0;
        }
    }

    updateMBC() {
        switch (this.rom[0x147]) {
            case 0x01: case 0x02: case 0x03:
                this.mbc = new MBC1(this);
                break;
            case 0x05: case 0x06:
                // this.mbc = new MBC2(this);
                break;
            case 0x0F: case 0x10: case 0x11: case 0x12: case 0x13:
                this.mbc = new MBC3(this);
                break;
            case 0x19: case 0x1A: case 0x1B: case 0x1B:
            case 0x1C: case 0x1D: case 0x1E:
                this.mbc = new MBC5(this);
                break;
            case 0x20:
                // this.mbc = new MBC6(this);
                break;
            case 0x22:
                // this.mbc = new MBC7(this);
                break;
            case 0x00: case 0x08:
            case 0x09: case 0x0B:
            case 0x0C: case 0x0D:
            default:
                this.mbc = new NullMBC(this);
                break;
        }
        let banks = 0;
        switch (this.rom[0x148]) {
            case 0x00: banks = 2; break;
            case 0x01: banks = 4; break;
            case 0x02: banks = 8; break;
            case 0x03: banks = 16; break;
            case 0x04: banks = 32; break;
            case 0x05: banks = 64; break;
            case 0x06: banks = 128; break;
            case 0x07: banks = 256; break;
            case 0x08: banks = 512; break;
            case 0x52: banks = 72; break;
            case 0x53: banks = 80; break;
            case 0x54: banks = 96; break;
        }
        this.romBanks = banks;
        console.log("Banks: " + banks);
        console.log(this.mbc);
    }
}