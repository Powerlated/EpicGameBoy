#!/bin/bash
rgbasm dmg_bootrom.asm -o dmg_bootrom.o
rgblink dmg_bootrom.o -o dmg_bootrom.bin
# rgbasm cgb_bootrom.asm -o cgb_bootrom.bin