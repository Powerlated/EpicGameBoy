
export class Serializer {
    data = new Uint8Array(0x1000000);
    pos = 0;

    putByte(i: number): void {
        this.data[this.pos] = i;
        this.pos++;
    }

    getByte(): number {
        let byte = this.data[this.pos];
        this.pos++;
        return byte;
    }

    resetPos() {
        this.pos = 0;
    }
}

export function PUT_8(state: Serializer, input: number) {
    state.putByte(input);
}

export function GET_8(state: Serializer): number {
    return state.getByte();
}

export function PUT_BOOL(state: Serializer, input: boolean) {
    state.putByte(input ? 1 : 0);
}

export function GET_BOOL(state: Serializer): boolean {
    return state.getByte() === 1;
}

export function PUT_16LE(state: Serializer, input: number) {
    let low = (input >> 0) & 0xFF;
    let high = (input >> 8) & 0xFF;

    state.putByte(low);
    state.putByte(high);
}

export function GET_16LE(state: Serializer) {
    let low = state.getByte();
    let high = state.getByte();

    return (high << 8) | low;
}

export function PUT_32LE(state: Serializer, input: number) {
    let b0 = (input >> 0) & 0xFF;
    let b1 = (input >> 8) & 0xFF;
    let b2 = (input >> 16) & 0xFF;
    let b3 = (input >> 24) & 0xFF;

    state.putByte(b0);
    state.putByte(b1);
    state.putByte(b2);
    state.putByte(b3);
}

export function GET_32LE(state: Serializer) {
    let b0 = state.getByte();
    let b1 = state.getByte();
    let b2 = state.getByte();
    let b3 = state.getByte();

    return (b3 << 24) | (b2 << 16) | (b1 << 8) | (b0 << 0);
}


export function PUT_8ARRAY(state: Serializer, input: Uint8Array, length: number) {
    if (length < input.length) console.error(`PUT_8ARRAY: Specified length larger than array length`);

    for (let i = 0; i < length; i++) {
        state.putByte(input[i]);
    }
}

export function GET_8ARRAY(state: Serializer, length: number): Uint8Array {
    let temp = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        temp[i] = state.getByte();
    }

    return temp;
}

