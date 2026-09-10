/** Formatira sekunde kao M:SS. */
export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, "0")}`;
}

/** Formatira milisekunde (zaokruženo naviše) kao M:SS. */
export function formatClockMs(ms: number): string {
  return formatMMSS(Math.ceil(ms / 1000));
}
