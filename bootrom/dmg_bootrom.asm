INCLUDE "include/hardware.inc"

LogoTotalBytes EQU 64

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
ld [hl], %00000000 ; Load palette

; -------------

; End Initialization

ld a, 0
MainLoop:
    ld hl, rBGP

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
    
    ld hl, rSCX
    ld [hl], 0

    ld hl, rSCY
    ld [hl], 0

    jp Unmap

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
    ld hl, rLY
    ld b, [hl]

    ld hl, rSCX

    cp 0
    jr z, HBlankHandler.ScrollOptime

    cp 59
    jr z, HBlankHandler.ScrollGB

    ret
HBlankHandler.ScrollOptime:
    ld bc, CurrentOptimeScroll
    ld a, [bc]
    inc a
    ld [bc], a
    ld [hl], a
    dec hl
    ld [hl], 252
    ret
HBlankHandler.ScrollGB:
    ld [hl], 240
    dec hl
    ld [hl], 244
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
    db %00000000, %00000000, %00000000, %00000000
    db %11101110, %11101110, %11111011, %10000000
    db %10101010, %01000100, %10101010, %00000000
    db %10101110, %01000100, %10101011, %10000000
    db %10101000, %01000100, %10101010, %00000000
    db %11101000, %01001110, %10101011, %10000000
    db %00000000, %00000000, %00000000, %00000000

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

SECTION "Unmap", ROM0[$FB]
Unmap:
    ld a,$11
	ld [$FF00+$50],a

; Just put this in so I don't accidently overflow into Cartridge ROM
SECTION "CartridgeROM", ROM0[$100]

SECTION "WorkRAM", WRAM0[$C000]

Countdown: ds 1
LogoBytesLeft: ds 1

CurrentOptimeScroll: ds 1