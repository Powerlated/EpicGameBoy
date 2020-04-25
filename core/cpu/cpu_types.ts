export enum R8 {
    B = 0, C = 1, D = 2, E = 3, H = 4, L = 5, iHL = 6, A = 7
}

export enum R16 {
    AF = 0x10, BC = 0x11, DE = 0x12, HL = 0x13, SP = 0x14
}

export type R = R8 | R16;

export enum CC {
    UNCONDITIONAL = -1,
    NZ = 0,
    Z = 1,
    NC = 2,
    C = 3,
}
