// This file is last and initializes node specific stuff.

// @ts-ignore
const IS_NODE = (typeof process !== 'undefined') && (process.release.name === 'node');


if (IS_NODE) {
    // @ts-ignore
    module.exports = { CPU, MemoryBus, GPU };
}