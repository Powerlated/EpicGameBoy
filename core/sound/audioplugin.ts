import SoundChip from "./sound";

export interface AudioPlugin {
    s: SoundChip

    pulse1(): void
    pulse2(): void
    wave(): void
    updateWaveTable(): void
    noise(): void
}