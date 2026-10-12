import type { VoiceLang } from "./types";

/**
 * Audio engine za boks tajmer.
 * - Zvono i tonovi su sintetizovani preko Web Audio API-ja (bez ijednog audio fajla).
 * - Glasovne najave idu preko ugrađenog Web Speech API-ja (speechSynthesis).
 *
 * VAŽNO: pregledači blokiraju zvuk dok korisnik ne interaguje sa stranicom.
 * Zato `unlockAudio()` MORA da se pozove iz korisničkog gesta (klik na Start).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Otključaj audio + glas iz korisničkog gesta (klik na Start). */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") {
    void c.resume();
  }
  // Otključaj speechSynthesis na iOS/Safari kratkim praznim iskazom.
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }
}

// ---- Zvono (metalni "ding") ----

const BELL_BASE = 700;
const BELL_PARTIALS = [
  { ratio: 1, gain: 0.5 },
  { ratio: 2.76, gain: 0.28 },
  { ratio: 5.4, gain: 0.16 },
  { ratio: 8.1, gain: 0.1 },
];

function bellHit(at: number): void {
  const c = getCtx();
  if (!c) return;
  const master = c.createGain();
  master.gain.value = 0.9;
  master.connect(c.destination);

  for (const { ratio, gain } of BELL_PARTIALS) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = BELL_BASE * ratio;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
    osc.connect(g).connect(master);
    osc.start(at);
    osc.stop(at + 1.7);
  }
}

/** Odsviraj zvono `times` puta (npr. 1 = runda, 3 = kraj treninga). */
export function bell(times = 1): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  for (let i = 0; i < times; i++) {
    bellHit(now + i * 0.45);
  }
}

/** Kratak ton (upozorenje / tik odbrojavanja). */
export function beep(freq = 1000, duration = 0.12): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Kratak "ping" (sinus, brz decay) — za ubrzavajuće odbrojavanje pred kraj runde. */
export function ping(freq = 1000): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.4, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Kratak "air-horn" (dva silazna tona) — distinktivan marker ulaska u završnih N s. */
export function horn(): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const tones: Array<[number, number, number]> = [
    [0, 0.26, 392],
    [0.3, 0.52, 311],
  ];
  for (const [s, e, f] of tones) {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now + s);
    g.gain.exponentialRampToValueAtTime(0.45, now + s + 0.02);
    g.gain.setValueAtTime(0.45, now + e - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + e);
    osc.connect(g).connect(c.destination);
    osc.start(now + s);
    osc.stop(now + e + 0.02);
  }
}

// ---- Glas (Web Speech API) ----

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    cachedVoices = window.speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | undefined {
  if (cachedVoices.length === 0) refreshVoices();
  const prefix = lang === "sr" ? "sr" : "en";
  return cachedVoices.find((v) => v.lang?.toLowerCase().startsWith(prefix));
}

/** Izgovori tekst na zadatom jeziku. Prekida prethodni iskaz. */
export function speak(text: string, lang: VoiceLang): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "sr" ? "sr-RS" : "en-US";
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

/** Prekini bilo koji tekući glasovni iskaz. */
export function cancelSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
