import { HWIO } from "../memory/hwio";

export class SerialPort implements HWIO {
    readHwio(addr: number): number {
        return 0xFF;
    }

    writeHwio(addr: number, value: number) {

    }
}