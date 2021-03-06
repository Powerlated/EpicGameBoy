https://old.reddit.com/r/EmuDev/comments/8uahbc/dmg_bgb_lcd_timings_and_cnt/e1iooum/

Mode 2's length is constant – 80 T cycles, 2 cycles per entry in OAM. Mode 1 is constant as well; (456 * 10 T cycles). It never changes.

Mode 3 works this way:

Base length of 172 T cycles
+ (SCX & 7)
+ 6 T-cycles per sprite on that line
+ For each sprite, there may be a penalty of up to 5 T-cycles for stopping the background fetcher, which depend on that sprite's X positions. Two sprites that share the same X position only "pay" the penalty once.
+ There probably is a penalty of up to 8 T-cycles if the window is visible on that line, but I haven't properly tested and verified it yet.
+ Mode 0 is takes whatever it takes to reach 456 T-cycles

A few more notes:

+ The PPU can read from OAM and VRAM at a 2 MHz rate
+ However, it has a 16-bit bus to OAM so it can read 2 bytes in just one T-cycle
+ The PPU pushes pixels to the LCD screen at 4MHz, i.e. 4 pixels per NOP assuming the PPU didn't stall
+ On a CGB, sprites will affect timing even if disabled. This does not occur on the DMG.
+ The CGB PPU had major differences introduced in revision D. It appears that AntonioND's doc describe CGB-CPU-C and lower.