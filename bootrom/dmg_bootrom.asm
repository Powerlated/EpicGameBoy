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
ld [hl], %00000000 ; Load palette

ld hl, rNR12
ld [hl], %11110111

; -------------


; Set scroll

; $FF42 - Scroll Y
; $FF43 - Scroll X
ld hl, rSCY
ld [hl], 252
inc hl
ld [hl], 240

; End Initialization

ld a, 0
MainLoop:
    ld hl, rBGP

    cp 20
    call z, SetBGP1
    cp 30
    call z, SetBGP2
    cp 40
    call z, SetBGP3

    
    cp 180
    call nc, ScrollOut

    cp 200
    call z, SetBGP2
    cp 220
    call z, SetBGP1
    cp 240
    call z, SetBGP0
    
WaitForVBlank:
    ld a, [rLY]
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
    ld [hl], %01010100
    ret
SetBGP1:
    ld [hl], %01010100
    ret
SetBGP2:
    ld [hl], %10101000
    ret
SetBGP3:
    ld [hl], %11111100
    ret

ScrollOut:
    ld hl, ScrollRate
    ld b, [hl] ; Load current scroll rate into B
    inc [hl]

    ld hl, rSCX
    ld a, [hl] ; Load current scroll X into A

    add a, b ; Add rate to current scroll X
    ld [hl], a ; Store 

    ret





Map:
    db %11111100, %10000000, %00000000, %00000000
    db %10000010, %10000000, %00000000, %00000000
    db %10000010, %10000000, %00000000, %00000000
    db %10000010, %10000000, %00000000, %00000000
    db %11111100, %10000000, %00000000, %00000000
    db %10000000, %10000000, %00000000, %00000000
    db %10000000, %10000000, %00000000, %00000000
    db %10000000, %11111110, %00000000, %00000000
    
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

ScrollRate: ds 1