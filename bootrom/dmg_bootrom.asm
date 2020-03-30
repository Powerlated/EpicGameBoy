INCLUDE "include/hardware.inc"

LogoTotalBytes EQU 62

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
ld c, LogoTotalBytes
LoadMap:
    ld b, 8 ; Total amount of real bytes to write per map byte
    ld a, [de] ; Load map byte into A
ContinueByte:
    rlca ; Rotate MSB of map byte into carry flag
    rl [hl] ; Rotate the carry flag into LSB of destination byte

    inc hl ; Increment destination after each bit
    dec b  ; Decrement bytes left
    jr nz, ContinueByte ; If we still have bits left, continue on this byte

    inc de

    dec c
    jr nz, LoadMap

; -------------


ld a, %10010001
ldh [rLCDC], a ; Turn on the PPU, also use lower tileset and enable BG/Window
ld a, %00000000
ldh [rBGP], a  ; Load palette

ld a, %00000000
ldh [rBCPS], a 
; -------------


; Init Audio
ld a, $80
ldh [$26], a
ldh [$11], a
ld a, $f3
ldh [$12], a
ldh [$25], a
ld a, $77
ldh [$24], a

; End Initialization

xor a
MainLoop:
    ld hl, rBGP; rBGP $FF47

    cp 20
    jr z, SetBGP1
    cp 30
    jr z, SetBGP2
    cp 40
    jr z, SetBGP3
    cp 180
    jr z, SetBGP2
    cp 200
    jr z, SetBGP1
    cp 220
    jr z, SetBGP0
    
WaitForVBlank:
    ld a, [rLY]
    call HBlankHandler
    cp $90
    jr nz, WaitForVBlank

    ld hl, Countdown
    inc [hl]

    ld a, [hl]

    cp 255
    jr nz, MainLoop
    
    xor a
    ld c, $42 ; rSCY $FF42
    ldh [C], a
    inc c
    ldh [C], a



    jr Unmap

SetBGP0:
    ld [hl], %00000000
    jr WaitForVBlank
SetBGP1:
    ld [hl], %01010100
    jr WaitForVBlank
SetBGP2:
    ld [hl], %10101000
    jr WaitForVBlank
SetBGP3:
    ld [hl], %11111100
    jr WaitForVBlank

HBlankHandler:
    ld hl, rSCY

    and a ; A & A does nothing to A itself but sets flags
    jr z, HBlankHandler.ScrollOptime

    cp 51
    jr z, HBlankHandler.ScrollEmpty

    cp 67
    jr z, HBlankHandler.ScrollGB

    ret
HBlankHandler.ScrollOptime:
    ld [hl], 244
    inc hl
    ldh a, [CurrentOptimeScroll]
    inc a
    ldh [CurrentOptimeScroll], a
    ld [hl], a
    ret
HBlankHandler.ScrollGB:
    ld [hl], 228
    inc hl
    ld [hl], 240
    ret
HBlankHandler.ScrollEmpty:
    ld [hl], 100
    ret



; ScrollOut:
;     ld hl, ScrollRate
;     ld b, [hl] ; Load current scroll rate into B
;     inc [hl]

;     ld hl, rSCX
;     ld a, [hl] ; Load current scroll X into A

;     add a, b ; Add rate to current scroll X
;     ld [hl], a ; Store 

;     ret


Map:
    db %11101110, %11101110, %11111011, %10000000
    db %10101010, %01000100, %10101010, %00000000
    db %10101110, %01000100, %10101011, %10000000
    db %10101000, %01000100, %10101010, %00000000
    db %11101000, %01001110, %10101011, %10000000

    db %11111110, %11111110, 0, 0
    db %10000000, %10000001, 0, 0
    db %10000000, %10000001, 0, 0
    db %10011110, %11111110, 0, 0
    db %10000010, %10000001, 0, 0
    db %10000010, %10000001, 0, 0
    db %10000010, %10000001, 0, 0
    db %11111110, %11111110


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
	ldh [$50],a

; Just put this in so I don't accidently overflow into Cartridge ROM
SECTION "CartridgeROM", ROM0[$100]

SECTION "HighRAM", HRAM

Countdown: ds 1
CurrentOptimeScroll: ds 1