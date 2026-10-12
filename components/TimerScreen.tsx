"use client";

import { useEffect, useState } from "react";
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

/** true kada je telefon u landscape-u (nizak viewport) — tada veliki layout. */
function useLandscapePhone(): boolean {
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 540px)");
    const update = () => setLandscape(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return landscape;
}

export default function TimerScreen({
  state,
  config,
  onPause,
  onResume,
  onSkip,
  onStop,
}: Props) {
  const { phase, currentRound, remainingMs, totalMs, isPaused } = state;
  const isLandscape = useLandscapePhone();

  const isWarning =
    phase === "round" &&
    config.warningSeconds > 0 &&
    remainingMs <= config.warningSeconds * 1000;

  const progress =
    totalMs > 0 ? remainingMs / totalMs : phase === "finished" ? 1 : 0;

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

  const activeColor = isPaused ? COLORS.finished : color;
  const time = formatClockMs(remainingMs);
  const phaseLabel = isPaused ? "PAUZIRANO" : label;

  // Kontrole (kompaktne u landscape-u).
  const controls = (compact: boolean) => {
    const base = `flex-1 select-none font-black tracking-wide active:brightness-90 ${
      compact ? "rounded-xl py-3 text-base" : "rounded-2xl py-5 text-lg"
    }`;
    if (phase === "finished") {
      return (
        <button
          type="button"
          onClick={onStop}
          className={`${base} bg-emerald-600 text-white`}
        >
          NAZAD
        </button>
      );
    }
    return (
      <>
        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          className={`${base} ${
            isPaused ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
          }`}
        >
          {isPaused ? "NASTAVI" : "PAUZA"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={`${base} bg-zinc-700 text-white`}
        >
          PRESKOČI
        </button>
        <button
          type="button"
          onClick={onStop}
          className={`${base} bg-red-600 text-white`}
        >
          STOP
        </button>
      </>
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Crveno blinkanje preko celog ekrana (iza sadržaja) */}
      {isWarning && !isPaused && (
        <div
          className="red-blink pointer-events-none absolute inset-0 z-0 bg-red-600"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex h-full w-full flex-col">
        {isLandscape ? (
          /* ---------- LANDSCAPE: ogromni brojevi ---------- */
          <div className="flex h-full w-full flex-col px-6 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span
                className="text-3xl font-black tracking-[0.15em]"
                style={{ color: activeColor }}
              >
                {phaseLabel}
              </span>
              {sub && phase !== "finished" && (
                <span className="text-4xl font-black tabular-nums text-white">
                  {sub}
                </span>
              )}
            </div>

            <div className="flex flex-1 items-center justify-center">
              {phase === "finished" ? (
                <div className="flex items-center gap-4">
                  <span className="text-7xl">🥊</span>
                  <span className="text-4xl font-black text-zinc-200">
                    Kraj treninga
                  </span>
                </div>
              ) : (
                <span
                  className="font-timer font-black leading-none tabular-nums text-white"
                  style={{ fontSize: "min(46vh, 34vw)" }}
                >
                  {time}
                </span>
              )}
            </div>

            {phase !== "finished" && (
              <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: activeColor,
                    transition: "width 0.2s linear",
                  }}
                />
              </div>
            )}

            <div className="flex w-full gap-2">{controls(true)}</div>
          </div>
        ) : (
          /* ---------- PORTRAIT: kružni prsten ---------- */
          <div className="flex h-full flex-col items-center justify-between px-5 py-8">
            <div className="flex h-16 flex-col items-center justify-center">
              <span
                className="text-2xl font-black tracking-[0.2em]"
                style={{ color: activeColor }}
              >
                {phaseLabel}
              </span>
            </div>

            <CircularRing progress={progress} color={activeColor}>
              {phase === "finished" ? (
                <div className="flex flex-col items-center">
                  <span className="text-6xl">🥊</span>
                  <span className="mt-2 text-xl font-bold text-zinc-300">
                    Kraj treninga
                  </span>
                </div>
              ) : (
                <>
                  <span className="font-timer text-[clamp(3.5rem,20vw,7rem)] font-black leading-none tabular-nums text-white">
                    {time}
                  </span>
                  {sub && (
                    <span className="mt-2 text-lg font-semibold text-zinc-400">
                      {sub}
                    </span>
                  )}
                </>
              )}
            </CircularRing>

            <div className="flex w-full max-w-md gap-3">{controls(false)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
