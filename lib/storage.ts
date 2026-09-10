import { DEFAULT_CONFIG, type Config } from "./types";

const KEY = "boks-tajmer-config-v1";

/** Učitaj poslednja podešavanja iz localStorage (ili podrazumevana). */
export function loadConfig(): Config {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<Config>;
    // Spoji sa podrazumevanim da nova polja uvek postoje.
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Sačuvaj podešavanja (tiho ignoriši ako localStorage nije dostupan). */
export function saveConfig(config: Config): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}
