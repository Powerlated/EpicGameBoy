interface MBC {
    gb: GameBoy;
    selectedBank: number;

    read: (addr: number) => number;
    write: (addr: number, value: number) => void;
}