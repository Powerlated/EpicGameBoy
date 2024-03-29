export interface HWIO {
    // MemoryBus calls readHwio on all components, and the first that returns NOT undefined gets read
    readHwio(addr: number): number;
    writeHwio(addr: number, value: number): void;
}