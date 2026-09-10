"use client";

import { useEffect, useRef, useState } from "react";
import { bell, beep, cancelSpeech, speak, unlockAudio } from "./audio";
import type { Config, Phase, TimerState, VoiceLang } from "./types";

const IDLE_STATE: TimerState = {
  phase: "idle",
  currentRound: 0,
  remainingMs: 0,
  totalMs: 0,
  isPaused: false,
};

const TICK_MS = 200;

function phrase(
  lang: VoiceLang,
  key: "prepare" | "rest" | "finished" | "warning",
  n?: number,
): string {
  if (key === "warning") {
    return lang === "sr" ? `${n} sekundi` : `${n} seconds`;
  }
  const sr = { prepare: "Spremi se", rest: "Pauza", finished: "Kraj treninga" };
  const en = { prepare: "Get ready", rest: "Rest", finished: "Workout complete" };
  return (lang === "sr" ? sr : en)[key];
}

function phaseDurationMs(phase: Phase, cfg: Config): number {
  switch (phase) {
    case "prepare":
      return cfg.prepSeconds * 1000;
    case "round":
      return cfg.roundSeconds * 1000;
    case "rest":
      return cfg.restSeconds * 1000;
    default:
      return 0;
  }
}

export function useBoxingTimer() {
  const [state, setState] = useState<TimerState>(IDLE_STATE);

  // Interni (mutabilni) podaci — ne izazivaju re-render.
  const cfgRef = useRef<Config | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const roundRef = useRef(0);
  const endsAtRef = useRef(0);
  const totalRef = useRef(0);
  const pausedRef = useRef(false);
  const pausedRemainingRef = useRef(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<() => void>(() => {});
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Cue flagovi po fazi.
  const warningFiredRef = useRef(false);
  const getReadyFiredRef = useRef(false);
  const lastTickSecRef = useRef(-1);

  // ---- pomoćne (poštuju podešavanja) ----
  const playBell = (n = 1) => {
    if (cfgRef.current?.soundEnabled) bell(n);
  };
  const playBeep = (freq?: number, dur?: number) => {
    if (cfgRef.current?.soundEnabled) beep(freq, dur);
  };
  const say = (text: string) => {
    const cfg = cfgRef.current;
    if (cfg?.voiceEnabled) speak(text, cfg.voiceLang);
  };
  const vibrate = (pattern: number | number[]) => {
    if (!cfgRef.current?.vibrationEnabled) return;
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      /* ignore */
    }
  };

  // ---- wake lock ----
  const requestWakeLock = async () => {
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      /* ignore (npr. tab nije u fokusu) */
    }
  };
  const releaseWakeLock = () => {
    try {
      void wakeLockRef.current?.release();
    } catch {
      /* ignore */
    }
    wakeLockRef.current = null;
  };

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ---- prelazak u fazu ----
  const enterPhase = (phase: Phase, round: number) => {
    const cfg = cfgRef.current;
    if (!cfg) return;

    phaseRef.current = phase;
    roundRef.current = round;
    warningFiredRef.current = false;
    getReadyFiredRef.current = false;
    lastTickSecRef.current = -1;

    if (phase === "finished") {
      totalRef.current = 0;
      playBell(3);
      say(phrase(cfg.voiceLang, "finished"));
      vibrate([200, 100, 200, 100, 200]);
      setState({
        phase,
        currentRound: round,
        remainingMs: 0,
        totalMs: 0,
        isPaused: false,
      });
      stopInterval();
      releaseWakeLock();
      return;
    }

    const dur = phaseDurationMs(phase, cfg);
    totalRef.current = dur;
    endsAtRef.current = Date.now() + dur;

    if (phase === "prepare") {
      say(phrase(cfg.voiceLang, "prepare"));
      vibrate(120);
    } else if (phase === "round") {
      playBell(1);
      vibrate([200, 80, 200]);
    } else if (phase === "rest") {
      say(phrase(cfg.voiceLang, "rest"));
      vibrate(200);
    }

    setState({
      phase,
      currentRound: round,
      remainingMs: dur,
      totalMs: dur,
      isPaused: false,
    });
  };

  // ---- sledeća faza ----
  const advance = () => {
    const cfg = cfgRef.current;
    if (!cfg) return;
    const phase = phaseRef.current;
    const round = roundRef.current;

    if (phase === "prepare") {
      enterPhase("round", 1);
    } else if (phase === "round") {
      if (round < cfg.rounds) {
        if (cfg.restEnabled && cfg.restSeconds > 0) enterPhase("rest", round);
        else enterPhase("round", round + 1);
      } else {
        enterPhase("finished", round);
      }
    } else if (phase === "rest") {
      enterPhase("round", round + 1);
    }
  };

  // ---- tick (uvek najsvežija verzija preko tickRef) ----
  const tick = () => {
    if (pausedRef.current) return;
    const phase = phaseRef.current;
    if (phase === "idle" || phase === "finished") return;
    const cfg = cfgRef.current;
    if (!cfg) return;

    let remaining = endsAtRef.current - Date.now();
    if (remaining < 0) remaining = 0;

    // Upozorenje pred kraj runde.
    if (
      phase === "round" &&
      !warningFiredRef.current &&
      cfg.warningSeconds > 0 &&
      cfg.warningSeconds < cfg.roundSeconds &&
      remaining <= cfg.warningSeconds * 1000
    ) {
      warningFiredRef.current = true;
      say(phrase(cfg.voiceLang, "warning", cfg.warningSeconds));
      playBeep(1000, 0.15);
      vibrate([120, 60, 120]);
    }

    // "Spremi se" pred kraj pauze.
    if (
      phase === "rest" &&
      !getReadyFiredRef.current &&
      cfg.prepSeconds > 0 &&
      cfg.prepSeconds < cfg.restSeconds &&
      remaining <= cfg.prepSeconds * 1000
    ) {
      getReadyFiredRef.current = true;
      say(phrase(cfg.voiceLang, "prepare"));
    }

    // Tikovi odbrojavanja (poslednje 3 sekunde) u prepare/rest fazi.
    if (phase === "prepare" || phase === "rest") {
      const sec = Math.ceil(remaining / 1000);
      if (sec !== lastTickSecRef.current) {
        lastTickSecRef.current = sec;
        if (sec >= 1 && sec <= 3) playBeep(880, 0.08);
      }
    }

    setState((s) => (s.remainingMs === remaining ? s : { ...s, remainingMs: remaining }));

    if (remaining <= 0) advance();
  };

  useEffect(() => {
    tickRef.current = tick;
  });

  // ---- javne kontrole ----
  const start = (config: Config) => {
    cfgRef.current = config;
    pausedRef.current = false;
    unlockAudio();
    void requestWakeLock();
    stopInterval();
    if (config.prepSeconds > 0) enterPhase("prepare", 0);
    else enterPhase("round", 1);
    intervalRef.current = setInterval(() => tickRef.current(), TICK_MS);
  };

  const pause = () => {
    const phase = phaseRef.current;
    if (phase === "idle" || phase === "finished" || pausedRef.current) return;
    pausedRef.current = true;
    pausedRemainingRef.current = Math.max(0, endsAtRef.current - Date.now());
    cancelSpeech();
    setState((s) => ({ ...s, isPaused: true }));
  };

  const resume = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    endsAtRef.current = Date.now() + pausedRemainingRef.current;
    setState((s) => ({ ...s, isPaused: false }));
  };

  const skip = () => {
    const phase = phaseRef.current;
    if (phase === "idle" || phase === "finished") return;
    pausedRef.current = false;
    advance();
  };

  const stop = () => {
    stopInterval();
    pausedRef.current = false;
    phaseRef.current = "idle";
    roundRef.current = 0;
    cancelSpeech();
    releaseWakeLock();
    setState(IDLE_STATE);
  };

  // Ponovo zatraži wake lock kad se tab vrati u fokus (browser ga otpušta).
  useEffect(() => {
    const onVisible = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        phaseRef.current !== "idle" &&
        phaseRef.current !== "finished" &&
        !wakeLockRef.current
      ) {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Čišćenje na unmount.
  useEffect(() => {
    return () => {
      stopInterval();
      releaseWakeLock();
      cancelSpeech();
    };
  }, []);

  return { state, start, pause, resume, skip, stop };
}
