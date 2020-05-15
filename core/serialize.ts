

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

    private putByte(i: number, a: Action): void {
        this.data[this.pos] = i;
        this.actionList[this.pos] = a;

        this.pos++;
    }

    private getByte(a: Action): number {
        let byte = this.data[this.pos];
        if (this.actionList[this.pos] !== a) console.error("Serializer.getByte(): Action mismatch");

        this.pos++;
        return byte;
    }

    resetPos() {
        this.pos = 0;
    }

    PUT_8(input: number) {
        this.putByte(input, Action.DATA_8);
    }

    GET_8(): number {
        return this.getByte(Action.DATA_8);
    }

    PUT_BOOL(input: boolean) {
        this.putByte(input ? 1 : 0, Action.DATA_BOOL);
    }

    GET_BOOL(): boolean {
        const byte = this.getByte(Action.DATA_BOOL);
        if (byte !== 0 && byte !== 1) console.log(`Possible misalignment: bool GET -> ${byte}`);

        return byte === 1;
    }

    PUT_16LE(input: number) {
        let low = (input >> 0) & 0xFF;
        let high = (input >> 8) & 0xFF;

        this.putByte(low, Action.DATA_16LE);
        this.putByte(high, Action.DATA_16LE);
    }

    GET_16LE() {
        let low = this.getByte(Action.DATA_16LE);
        let high = this.getByte(Action.DATA_16LE);

        return (high << 8) | low;
    }

    PUT_32LE(input: number) {
        let b0 = (input >> 0) & 0xFF;
        let b1 = (input >> 8) & 0xFF;
        let b2 = (input >> 16) & 0xFF;
        let b3 = (input >> 24) & 0xFF;

        this.putByte(b0, Action.DATA_32LE);
        this.putByte(b1, Action.DATA_32LE);
        this.putByte(b2, Action.DATA_32LE);
        this.putByte(b3, Action.DATA_32LE);
    }

    GET_32LE() {
        let b0 = this.getByte(Action.DATA_32LE);
        let b1 = this.getByte(Action.DATA_32LE);
        let b2 = this.getByte(Action.DATA_32LE);
        let b3 = this.getByte(Action.DATA_32LE);

        return (b3 << 24) | (b2 << 16) | (b1 << 8) | (b0 << 0);
    }


    PUT_8ARRAY(input: Uint8Array, length: number) {
        if (length > input.length) console.error(`PUT_8ARRAY: Specified length larger than array length`);

        for (let i = 0; i < length; i++) {
            this.putByte(input[i], Action.DATA_8ARRAY);
        }
    }

    GET_8ARRAY(length: number): Uint8Array {
        let temp = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            temp[i] = this.getByte(Action.DATA_8ARRAY);
        }

        return temp;
    }
}

