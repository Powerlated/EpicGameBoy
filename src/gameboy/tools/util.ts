export function unTwo4b(n: number): number {
    if ((n & 0b1000) != 0) {
        return n - 16;
    } else {
        return n;
    }
}

export function unTwo8b(n: number): number {
    if ((n & 0b10000000) != 0) {
        return n - 256;
    } else {
        return n;
    }
}

export function unTwo16b(n: number): number {
    if ((n & 0b1000000000000000) != 0) {
        return n - 65536;
    } else {
        return n;
    }
}

export function o16b(i: number): number {
    return i & 0xFFFF;
}

export function do4b(i: number): boolean {
    return i > 0xF || i < 0;
}

export function do8b(i: number): boolean {
    return i > 0xFF || i < 0;
}

export function do16b(i: number): boolean {
    return i > 0xFFFF || i < 0;
}

export function hex(i: any, digits: number) {
    return `0x${pad(i.toString(16), digits, '0').toUpperCase()}`;
}

export function hexN(i: any, digits: number) {
    return pad(i.toString(16), digits, '0').toUpperCase();
}

export function hexN_LC(i: any, digits: number) {
    return pad(i.toString(16), digits, '0');
}

export function pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function r_pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}