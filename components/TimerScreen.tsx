"use client";

import type { Config, TimerState } from "@/lib/types";
import { formatClockMs } from "@/lib/format";
import CircularRing from "./CircularRing";

type Props = {
  state: TimerState;
  config: Config;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
};

const COLORS = {
  prepare: "#f59e0b", // amber
  round: "#22c55e", // green
  warning: "#ef4444", // red
  rest: "#38bdf8", // sky
  finished: "#a1a1aa", // zinc
};

export default function TimerScreen({
  state,
  config,
  onPause,
  onResume,
  onSkip,
  onStop,
}: Props) {
  const { phase, currentRound, remainingMs, totalMs, isPaused } = state;

  const isWarning =
    phase === "round" &&
    config.warningSeconds > 0 &&
    remainingMs <= config.warningSeconds * 1000;

  const progress = totalMs > 0 ? remainingMs / totalMs : phase === "finished" ? 1 : 0;

  let color: string = COLORS.round;
  let label = "";
  let sub = "";

  switch (phase) {
    case "prepare":
      color = COLORS.prepare;
      label = "SPREMI SE";
      break;
    case "round":
      color = isWarning ? COLORS.warning : COLORS.round;
      label = "RUNDA";
      sub = `${currentRound} / ${config.rounds}`;
      break;
    case "rest":
      color = COLORS.rest;
      label = "PAUZA";
      sub = `sledeća ${currentRound + 1} / ${config.rounds}`;
      break;
    case "finished":
      color = COLORS.finished;
      label = "GOTOVO";
      break;
  }

  const btnBase =
    "flex-1 rounded-2xl py-5 text-lg font-black tracking-wide select-none active:brightness-90";

  return (
    <div className="flex h-full flex-col items-center justify-between px-5 py-8">
      {/* Faza */}
      <div className="flex h-16 flex-col items-center justify-center">
        <span
          className="text-2xl font-black tracking-[0.2em]"
          style={{ color: isPaused ? COLORS.finished : color }}
        >
          {isPaused ? "PAUZIRANO" : label}
        </span>
      </div>

      {/* Prsten + vreme */}
      <CircularRing progress={progress} color={isPaused ? COLORS.finished : color}>
        {phase === "finished" ? (
          <div className="flex flex-col items-center">
            <span className="text-6xl">🥊</span>
            <span className="mt-2 text-xl font-bold text-zinc-300">
              Kraj treninga
            </span>
          </div>
        ) : (
          <>
            <span
              className={`font-timer text-[clamp(3.5rem,20vw,7rem)] font-black leading-none tabular-nums text-white ${
                isWarning && !isPaused ? "animate-pulse" : ""
              }`}
            >
              {formatClockMs(remainingMs)}
            </span>
            {sub && (
              <span className="mt-2 text-lg font-semibold text-zinc-400">
                {sub}
              </span>
            )}
          </>
        )}
      </CircularRing>

      {/* Kontrole */}
      <div className="flex w-full max-w-md gap-3">
        {phase === "finished" ? (
          <button
            type="button"
            onClick={onStop}
            className={`${btnBase} bg-emerald-600 text-white`}
          >
            NAZAD
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className={`${btnBase} ${
                isPaused
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 text-black"
              }`}
            >
              {isPaused ? "NASTAVI" : "PAUZA"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className={`${btnBase} bg-zinc-700 text-white`}
            >
              PRESKOČI
            </button>
            <button
              type="button"
              onClick={onStop}
              className={`${btnBase} bg-red-600 text-white`}
            >
              STOP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
