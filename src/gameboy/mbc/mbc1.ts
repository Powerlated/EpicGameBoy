enum BankingModes {
    ROMBankingMode = "ROM", RAMBankingMode = "RAM"
}

class MBC1 implements MBC {
    romBank = 1;
    ramBank = 0;
    enableExternalRam = false;
    externalRam: Array<number> = [];

    bankingMode = BankingModes.ROMBankingMode;

    bus: MemoryBus;

    constructor(bus: MemoryBus) {
        this.bus = bus;
    }

    readBank(addr: number, bank: number): number {
        let calculated = (bank * MBC.bankSize) + (addr - MBC.bankSize);
        return this.bus.rom[calculated];
    }

    read(addr: number): number {
        // Bank 0 (Read Only)
        if (addr >= 0x0000 && addr <= 0x3FFF) {
            return this.bus.rom[addr];
        }
        // Banks 01-7F (Read Only)
        if (addr >= 0x4000 && addr <= 0x7FFF) {
            return this.readBank(addr, this.romBank);
        }
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            return this.externalRam[addr];
        }

        return 0xFF;
    }

    write(addr: number, value: number) {
        if (addr >= 0x2000 && addr <= 0x3FFF) {
            // MBC1 - Writing 0 will select 1
            if (value == 0) {
                this.romBank = 1;
            } else {
                this.romBank = value & 0b11111; // Whole 5 bits
            }
            return;
        }
        // RAM Enable
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            if ((value & 0xF) == 0x0A) {
                this.enableExternalRam = true;
            } else {
                this.enableExternalRam = false;
            }
            return;
        }
        // RAM Bank Number / Upper Bits of ROM Bank Number
        if (addr >= 0x4000 && addr <= 0x5FFF) {
            value &= 0b11;
            if (this.bankingMode == BankingModes.RAMBankingMode) {
                this.ramBank = value;
            } else {
                this.romBank &= 0b11111;
                this.romBank |= (value << 5);
            }

            return;
        }
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            this.externalRam[addr] = value;
            return;
        }

        if (addr >= 0x6000 && addr <= 0x7FFF) {
            if ((value & 1) == 1) {
                this.bankingMode = BankingModes.ROMBankingMode;
            } else {
                this.bankingMode = BankingModes.RAMBankingMode;
            }
            return;
        }
    }

    reset() {
        this.romBank = 1;
        this.ramBank = 0;
        this.enableExternalRam = false;
        this.externalRam = this.externalRam.map(() => { return 0 }); // Zero out external RAM
        this.bankingMode = BankingModes.ROMBankingMode
    }
}