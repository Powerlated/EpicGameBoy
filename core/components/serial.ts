import { HWIO } from "../memory/hwio";

export class SerialPort implements HWIO {
    readHwio(addr: number): number {
        return 0x00;
    }

    writeHwio(addr: number, value: number) {

    }
}