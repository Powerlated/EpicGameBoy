import SoundChip from "../sound/sound";


export interface AudioPlugin {
    
    pulse1(s: SoundChip): void;
    pulse2(s: SoundChip): void;
    wave(s: SoundChip): void;
    updateWaveTable(s: SoundChip): void;
    noise(s: SoundChip): void;

    reset(): void;

    setMuted(muted: boolean): void;
}