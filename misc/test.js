writeDebug("Starting emulator test");

const { StringDecoder } = require('string_decoder');

global.alert = msg => { console.warn(msg); cleanUp(); };

require('source-map-support').install();
let gameboy = require("../src/gameboy/gameboy");
let fs = require("fs");

writeDebug("Loading ROM " + process.argv[2]);
let buffer = fs.readFileSync(`${process.argv[2]}`);

writeDebug(gameboy)
let gb = new gameboy.GameBoy();

let cpu = gb.cpu;
cpu.logging = false;

buffer.forEach((v, i, a) => {
  cpu.gb.bus.rom[i] = v;
});

function cleanUp() {
  writeDebug(`---- START SERIAL DATA ----`);
  writeDebug(new StringDecoder("utf8").write(Buffer.from(cpu.gb.bus.serialOut)));
  writeDebug(`----- END SERIAL DATA -----`);

  cpu.khzStop();
  fs.writeFileSync("./logs/EpicGameBoy.log", cpu.log.join("\n"));
  fs.writeFileSync("./EpicGameBoy_Full.log", cpu.fullLog.join("\n"));
  writeDebug("Wrote log file");
  process.exit(0);
}

setTimeout(() => {
  writeDebug("Starting test");
  cpu.khz();
  setInterval(() => {
    writeDebug(cpu.totalI);
    if (cpu.lastOpcodeReps > 10000) {
      writeDebug(`Stuck on ${cpu.rgOpcode(cpu.lastOpcode).op.name} for 10000 instructions, exiting.`);
      cleanUp();
    }

    const EXIT_AT = 1000000;
    if (cpu.totalI > EXIT_AT) {
      writeDebug(`Hit ${EXIT_AT} instructions, exiting.`);
      cleanUp();
    }
  }, 100);

}, 0);
