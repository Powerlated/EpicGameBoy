import { BIT_0, BIT_2, BIT_1, BIT_3, bit } from "../bit_constants";

export type VBMFrame = {
    a: boolean,
    b: boolean,
    select: boolean,
    start: boolean,
    right: boolean,
    left: boolean,
    up: boolean,
    down: boolean,
    resetOld: boolean,
    resetNew: boolean;
};

function ParseVBM(file: Uint8Array): VBMFrame[] | null {
    console.log(`----- Decode VBM -----`);

    let isVBM = true;
    if (file[0] != 0x56) isVBM = false;
    if (file[1] != 0x42) isVBM = false;
    if (file[2] != 0x4D) isVBM = false;
    if (file[3] != 0x1A) isVBM = false;

    if (!isVBM) {
        console.log("Error: VBM Signature wrong!");
        return null;
    } else {
        let name = new TextDecoder("utf-8").decode(file.slice(0x24, 0x24 + 12));
        let sramOffs = getInt32LE(file.slice(0x38, 0x38 + 4));
        let frameCount = getInt32LE(file.slice(0xC, 0xC + 4));


        if (sramOffs == 0) {
            console.log("No SRAM");
        }

        console.log(`Name: ${name}`);
        console.log(`Frames: ${frameCount}`);

        let controllerFlags = file[0x15];
        let controller1 = bit(controllerFlags, 0);
        let controller2 = bit(controllerFlags, 1);
        let controller3 = bit(controllerFlags, 2);
        let controller4 = bit(controllerFlags, 3);

        let controllerCount = 0;

        if (controller1) controllerCount++;
        if (controller2) controllerCount++;
        if (controller3) controllerCount++;
        if (controller4) controllerCount++;

        if (controllerCount != 1)
            console.log('More or less than 1 controller detected');

        let systemFlags = file[0x16];
        let isGBA = bit(systemFlags, 0);
        let isGBC = bit(systemFlags, 1);
        let isSGB = bit(systemFlags, 2);
        let isDMG = !(isGBA || isGBC || isSGB);

        if (!(isGBC || isDMG)) {
            console.log("Movie is not for DMG or CGB");
        } else {
            if (isGBC && !isDMG) {
                console.log("For CGB");
            } else {
                console.log("For DMG");
            }
        }

        /**
         * A
         * B
         * Select
         * Start
         * Right
         * Left
         * Up
         * Down
         * R
         * L
         */

        let inputArr: VBMFrame[] = [];

        let inputOffs = getInt32LE(file.slice(0x3C, 0x3C + 4));
        let inputEnded = false;
        while (!inputEnded) {
            let b0 = file[inputOffs + 0];
            let b1 = file[inputOffs + 1];

            let a = bit(b0, 0);
            let b = bit(b0, 1);
            let select = bit(b0, 2);
            let start = bit(b0, 3);
            let right = bit(b0, 4);
            let left = bit(b0, 5);
            let up = bit(b0, 6);
            let down = bit(b0, 7);

            let resetOld = bit(b1, 2);
            let resetNew = bit(b1, 3);

            inputArr.push({
                a: a,
                b: b,
                select: select,
                start: start,
                right: right,
                left: left,
                up: up,
                down: down,
                resetOld: resetOld,
                resetNew: resetNew,
            });

            inputOffs += 2;
            inputEnded = inputOffs >= file.length;
        }

        return inputArr;
    }
}


function getInt32LE(i: Uint8Array) {
    return new DataView(i.buffer, 0).getInt32(0, true);
}

export { ParseVBM };