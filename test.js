console.log("Starting emulator test");

const { StringDecoder } = require('string_decoder');

global.alert = msg => { console.warn(msg); cleanUp(); };

require('source-map-support').install();
let gameboy = require("./src/gameboy/gameboy");
let fs = require("fs");

console.log("Loading ROM " + process.argv[2]);
let buffer = fs.readFileSync(`${process.argv[2]}`);

let cpu = new gameboy.CPU();
cpu.logging = true;

buffer.forEach((v, i, a) => {
  cpu.bus.memory[i] = v;
});

function cleanUp() {
  console.log(`---- START SERIAL DATA ----`)
  console.log(new StringDecoder("utf8").write(Buffer.from(cpu.bus.serialOut)));
  console.log(`----- END SERIAL DATA -----`)

  cpu.khzStop();
  fs.writeFileSync("./logs/EpicGameBoy.log", cpu.log.join("\n"));
  fs.writeFileSync("./EpicGameBoy_Full.log", cpu.fullLog.join("\n"));
  console.log("Wrote log file");
  process.exit(0);
}

setTimeout(() => {
  console.log("Starting test");
  cpu.khz();
  setInterval(() => {
    console.log(cpu.totalI);
    if (cpu.lastOpcodeReps > 10000) {
      console.log(`Stuck on ${cpu.rgOpcode(cpu.lastOpcode).op.name} for 10000 instructions, exiting.`)
      cleanUp();
    }

    const EXIT_AT = 50000;
    if (cpu.totalI > EXIT_AT) {
      console.log(`Hit ${EXIT_AT} instructions, exiting.`);
      cleanUp();
    }
  }, 10);

}, 0);
