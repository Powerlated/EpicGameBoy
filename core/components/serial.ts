import { HWIO } from "../memory/hwio";

export class SerialPort implements HWIO {
    readHwio(addr: number): number {
        if (addr === 0xFF01) {
            return 0x00;
        } else {
            return 0x7E;
        }
    }

    writeHwio(addr: number, value: number) {
    }
}