export type Value = {
    real: number,
    imag: number,
};

export default class ComplexArray {
    ArrayType: any;
    real: number[];
    imag: number[];
    length: number;
    constructor(other: number | ComplexArray, arrayType = Float32Array) {
        if (other instanceof ComplexArray) {
            // Copy constuctor.
            this.ArrayType = other.ArrayType;
            this.real = new this.ArrayType(other.real);
            this.imag = new this.ArrayType(other.imag);
        } else {
            this.ArrayType = arrayType;
            // other can be either an array or a number.
            this.real = new this.ArrayType(other);
            this.imag = new this.ArrayType(this.real.length);
        }

        this.length = this.real.length;
    }

    toString() {
        const components: string[] = [];

        this.forEach((value: Value, i: number) => {
            components.push(
                `(${value.real.toFixed(2)}, ${value.imag.toFixed(2)})`
            );
        });

        return `[${components.join(', ')}]`;
    }

    forEach(iterator: Function) {
        const n = this.length;
        // For gc efficiency, re-use a single object in the iterator.
        const value: Value = Object.seal(Object.defineProperties({}, {
            real: { writable: true }, imag: { writable: true },
        }));

        for (let i = 0; i < n; i++) {
            value.real = this.real[i];
            value.imag = this.imag[i];
            iterator(value, i, n);
        }
    }

    // In-place mapper.
    map(mapper: Function) {
        this.forEach((value: Value, i: number, n: Value[]) => {
            mapper(value, i, n);
            this.real[i] = value.real;
            this.imag[i] = value.imag;
        });

        return this;
    }

    conjugate() {
        return new ComplexArray(this).map((value: Value) => {
            value.imag *= -1;
        });
    }

    magnitude() {
        const mags = new this.ArrayType(this.length);

        this.forEach((value: Value, i: number) => {
            mags[i] = Math.sqrt(value.real * value.real + value.imag * value.imag);
        });

        return mags;
    }
}