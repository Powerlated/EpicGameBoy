#!/bin/bash
rgbasm dmg_bootrom.asm -o dmg_bootrom.o
rgblink dmg_bootrom.o -o dmg_bootrom.bin -n dmg_bootrom.sym
truncate -s 256 dmg_bootrom.bin
# rgbasm cgb_bootrom.asm -o cgb_bootrom.bin