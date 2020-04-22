Emulator frontend is located in `src`, emulator core is located in `core`.

# GameBoy

The master class GameBoy holds instances of all the hardware components:

* CPU
* GPU (or PPU)
* Sound Chip (or APU)
* Memory Bus
* Joypad
* Interrupt Controller
* DMA Controlller
* Timer

Master flags:

* `GameBoy.cgb`
* `GameBoy.doubleSpeed`
* `GameBoy.prepareSpeedSwitch`

The method `GameBoy.getCyclesUntilNextSync()` considers the state of GPU and
timer and determines how many T-cycles can be safely run before
catching up the GPU and timer.

A master `GameBoy.reset()` method calls all of the component reset methods 
and initializes the register state of the CPU.

# CPU

The instruction fetcher, decoder, and executor is implemented in
`CPU.fetchDecodeExecute()`. Upon invocation, it will execute a single instruction by way of: 

* Fetch opcode
* Decode via switch statement
* Execute functionality

# GPU

The GPU implements a scanline based renderer. A scanline based renderer is sufficient for most purposes, but is not for games that change rendering parameters mid-scanline. 

Emulated feature:
* Hblank on Line 153
* Current window rendering line persists if enabled AND onscreen, disabled, and re-enabled later
* OAM Scan
    * A maximum of ten sprites will be rendered per scanline, as on the original Game Boy

If a `VideoPlugin` is registered, when the emulated GPU hits Vblank, `VideoPlugin.drawGameboy(img)` will be called for the frontend to display to an HTML Canvas or any other video output. 

# DMA

`DMAController` contains methods for rapidly transferring data from various memory locations to VRAM and OAM.

# Memory Bus

`MemoryBus` has the main `read` and `write` methods that are used for reading and writing data by components.

Addresses are decoded by `if` statement. An HWIO interface is available for components that have memory mapped I/O.

`MemoryBus.addCheat(addr, value)`, `MemoryBus.removeCheat(addr)`, `MemoryBus.clearCheats()` are provided for the emulator frontend to manage cheats.