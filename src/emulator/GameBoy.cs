using System;

namespace DMSharp
{

    public class GameBoy
    {


        public CPU cpu;
        public GPU gpu;
        public InterruptController interrupts;
        public MemoryBus bus;
        public SoundChip soundChip;

        public Timer timer;

        public int speedMul = 1;

        public GameBoy()
        {
            this.cpu = new CPU(this);
            this.gpu = new GPU(this);
            this.bus = new MemoryBus(this);
            this.soundChip = new SoundChip(this);
            this.timer = new Timer(this);
            this.interrupts = new InterruptController(this.bus);
            Util.WriteDebug("New gameboy!");
            // setInterval(() => { this.bus.ext.saveGameSram(); }, 1000);
        }


        internal void Step()
        {
            this.soundChip.Step();
            this.cpu.Step();
            this.gpu.Step();
            this.timer.Step();
        }


        internal void speedStop()
        {
            this.cpu.stopNow = true;
            // this.soundChip.tjs.setMuted(true);
        }

        internal void speed()
        {
            this.cpu.debugging = false;
            this.cpu.stopNow = false;
            // this.soundChip.tjs.setMuted(false);
        }

        internal void frame()
        {
            long i = 0;
            // const max = 70224; // Full frame GPU timing
            var max = 70224 * this.speedMul; // Full frame GPU timing, double speed
            if (this.cpu.breakpoints.Contains(this.cpu.pc) || this.cpu.stopNow)
            {
                this.speedStop();
            }
            while (i < max && !this.cpu.breakpoints.Contains(this.cpu.pc) && !this.cpu.stopNow)
            {
                this.Step();
                i += this.cpu.lastInstructionCycles;
            }
            if (this.cpu.stopNow) this.cpu.stopNow = false;
        }



        public void Reset()
        {
            this.cpu.Reset();
            this.gpu.Reset();
            this.interrupts.Reset();
            this.bus.Reset();
            this.timer.Reset();
            this.soundChip.Reset();
        }
    }
}