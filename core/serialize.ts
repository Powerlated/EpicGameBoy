

enum Action {
    DATA_8 = 0,
    DATA_16LE,
    DATA_32LE,
    DATA_8ARRAY,
    DATA_BOOL,
}

export class Serializer {
    data = new Uint8Array(131072);
    pos = 0;
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    actionList: Action[] = [];

    putByte(i: number, a: Action): void {
        this.data[this.pos] = i;
        this.actionList[this.pos] = a;

        this.pos++;
    }

    getByte(a: Action): number {
        let byte = this.data[this.pos];
        if (this.actionList[this.pos] !== a) console.error("Serializer.getByte(): Action mismatch");

        this.pos++;
        return byte;
    }

    resetPos() {
        this.pos = 0;
    }
}

export function PUT_8(state: Serializer, input: number) {
    state.putByte(input, Action.DATA_8);
}

export function GET_8(state: Serializer): number {
    return state.getByte(Action.DATA_8);
}

export function PUT_BOOL(state: Serializer, input: boolean) {
    state.putByte(input ? 1 : 0, Action.DATA_BOOL);
}

export function GET_BOOL(state: Serializer): boolean {
    const byte = state.getByte(Action.DATA_BOOL);
    if (byte !== 0 && byte !== 1) console.log(`Possible misalignment: bool GET -> ${byte}`);

    return byte === 1;
}

export function PUT_16LE(state: Serializer, input: number) {
    let low = (input >> 0) & 0xFF;
    let high = (input >> 8) & 0xFF;

    state.putByte(low, Action.DATA_16LE);
    state.putByte(high, Action.DATA_16LE);
}

export function GET_16LE(state: Serializer) {
    let low = state.getByte(Action.DATA_16LE);
    let high = state.getByte(Action.DATA_16LE);

    return (high << 8) | low;
}

export function PUT_32LE(state: Serializer, input: number) {
    let b0 = (input >> 0) & 0xFF;
    let b1 = (input >> 8) & 0xFF;
    let b2 = (input >> 16) & 0xFF;
    let b3 = (input >> 24) & 0xFF;

    state.putByte(b0, Action.DATA_32LE);
    state.putByte(b1, Action.DATA_32LE);
    state.putByte(b2, Action.DATA_32LE);
    state.putByte(b3, Action.DATA_32LE);
}

export function GET_32LE(state: Serializer) {
    let b0 = state.getByte(Action.DATA_32LE);
    let b1 = state.getByte(Action.DATA_32LE);
    let b2 = state.getByte(Action.DATA_32LE);
    let b3 = state.getByte(Action.DATA_32LE);

    return (b3 << 24) | (b2 << 16) | (b1 << 8) | (b0 << 0);
}


export function PUT_8ARRAY(state: Serializer, input: Uint8Array, length: number) {
    if (length > input.length) console.error(`PUT_8ARRAY: Specified length larger than array length`);

    for (let i = 0; i < length; i++) {
        state.putByte(input[i], Action.DATA_8ARRAY);
    }
}

export function GET_8ARRAY(state: Serializer, length: number): Uint8Array {
    let temp = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        temp[i] = state.getByte(Action.DATA_8ARRAY);
    }

    return temp;
}

