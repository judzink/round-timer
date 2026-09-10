export type VoiceLang = "sr" | "en";

export type Config = {
  /** Broj rundi */
  rounds: number;
  /** Trajanje runde u sekundama */
  roundSeconds: number;
  /** Trajanje pauze u sekundama */
  restSeconds: number;
  /** Da li postoji pauza između rundi */
  restEnabled: boolean;
  /** "Spremi se" odbrojavanje pre prve runde (sek) */
  prepSeconds: number;
  /** Koliko sekundi pred kraj runde ide upozorenje */
  warningSeconds: number;
  /** Jezik glasovnih najava */
  voiceLang: VoiceLang;
  /** Zvono/tonovi uključeni */
  soundEnabled: boolean;
  /** Glasovne najave uključene */
  voiceEnabled: boolean;
  /** Vibracija (telefon) uključena */
  vibrationEnabled: boolean;
};

export type Phase = "idle" | "prepare" | "round" | "rest" | "finished";

export type TimerState = {
  phase: Phase;
  /** Trenutna runda (1..rounds); 0 dok traje "spremi se" */
  currentRound: number;
  /** Preostalo vreme tekuće faze (ms) */
  remainingMs: number;
  /** Ukupno trajanje tekuće faze (ms) — za prsten */
  totalMs: number;
  isPaused: boolean;
};

export const DEFAULT_CONFIG: Config = {
  rounds: 10,
  roundSeconds: 180,
  restSeconds: 60,
  restEnabled: true,
  prepSeconds: 10,
  warningSeconds: 15,
  voiceLang: "sr",
  soundEnabled: true,
  voiceEnabled: true,
  vibrationEnabled: true,
};

/** Procena ukupnog trajanja treninga u sekundama. */
export function estimateTotalSeconds(c: Config): number {
  const rounds = Math.max(1, c.rounds);
  const work = rounds * c.roundSeconds;
  const rests = c.restEnabled ? (rounds - 1) * c.restSeconds : 0;
  return c.prepSeconds + work + Math.max(0, rests);
}
