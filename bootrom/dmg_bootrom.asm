INCLUDE "include/hardware.inc"

LogoTotalBytes EQU 66

SECTION "BootROM", ROM0[$0]

; Initialization

ld sp, $FFFE ; Put SP into High RAM

ld hl, $97FF
ZeroVRAM: ; The classic zero VRAM from the original bootrom
    ld [hl], 0 
    dec hl
    bit 7, h
    jr nz, ZeroVRAM

; -------------

ld hl, LogoBytesLeft
ld [hl], LogoTotalBytes

ld hl, $8010 ; Tile 1 (0-indexed)
ld a, $FF
ld b, $10
WriteBlock: ; Load an 8x8 block into character RAM
    ld [hl], a
    dec b
    inc hl
    jr nz, WriteBlock

; -------------

ld hl, $9800
ld de, Map
LoadMap:
    ld b, 8 ; Total amount of real bytes to write per map byte

    push hl
    push de ; Move DE
    pop hl  ; Into HL
    ld c, [hl] ; Load map byte into C
    pop hl
ContinueByte:
    rlc c ; Rotate MSB of map byte into carry flag
    jr nc, SetWhite ; SetWhite if not carry, fall through to SetBlack otherwise 
SetBlack: inc [hl]
SetWhite: ; Do nothing because white is default
    inc hl 
    dec b
    jr nz, ContinueByte

    inc de

    push hl
    ld hl, LogoBytesLeft
    dec [hl] ; If we don't have zero bytes left, load another map byte
    pop hl
    jr nz, LoadMap

; -------------


ld hl, rLCDC
ld [hl], %10010001 ; Turn on the PPU, also use lower tileset and enable BG/Window
ld hl, rBGP
ld [hl], %11111100 ; Load palette

; End Initialization

MainLoop:
    call WaitForVBlank
    ld hl, Countdown
    inc [hl]
    ld a, [hl]
    cp 255
    jr nz, MainLoop
    jp Unmap

WaitForVBlank:
    ld a, [rLY]
    cp 144
    jr nz, WaitForVBlank
    ret

Map:
    db %11111100, %10000000, 0, 0
    db %10000010, %10000000, 0, 0
    db %10000010, %10000000, 0, 0
    db %10000010, %10000000, 0, 0
    db %11111100, %10000000, 0, 0
    db %10000000, %10000000, 0, 0
    db %10000000, %10000000, 0, 0
    db %10000000, %11111110, 0, 0
    
    db 0,0,0,0

    db %11111110, %11111110, 0, 0
    db %10000000, %10000001, 0, 0
    db %10000000, %10000001, 0, 0
    db %10011110, %11111110, 0, 0
    db %10000010, %10000001, 0, 0
    db %10000010, %10000001, 0, 0
    db %10000010, %10000001, 0, 0
    db %11111110, %11111110, 0, 0




; CharP:
;  db %11111110
;  db %10000010
;  db %11111110
;  db %10000000
;  db %10000000
;  db %10000000
;  db %10000000

; CharS:
;  db %11111110
;  db %10000010
;  db %10000010
;  db %11111110
;  db %10000010
;  db %00000010
;  db %00000010
;  db %11111110

; CharM:
;  db %11111110
;  db %10010010
;  db %10010010
;  db %10010010
;  db %10010010
;  db %10010010
;  db %10010010
;  db %10010010

 
; CharA:
;  db %11111110
;  db %10000010
;  db %10000010
;  db %11111110
;  db %10000010
;  db %10000010
;  db %10000010
;  db %10000010

; CharL:
;  db %10000000
;  db %10000000
;  db %10000000
;  db %10000000
;  db %10000000
;  db %10000000
;  db %10000000
;  db %11111110

SECTION "Unmap", ROM0[$FC]
Unmap:
    ld a,$01
	ld [$FF00+$50],a

; Just put this in so I don't accidently overflow into Cartridge ROM
SECTION "CartridgeROM", ROM0[$100]

SECTION "WorkRAM", WRAM0[$C000]

Countdown: ds 1

LogoBytesLeft: ds 1