"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CONFIG, type Config } from "@/lib/types";
import { loadConfig, saveConfig } from "@/lib/storage";
import { useBoxingTimer } from "@/lib/useBoxingTimer";
import SettingsScreen from "@/components/SettingsScreen";
import TimerScreen from "@/components/TimerScreen";

export default function Home() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const timer = useBoxingTimer();

  // Učitaj sačuvana podešavanja nakon mount-a (izbegava hydration mismatch).
  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const updateConfig = (c: Config) => {
    setConfig(c);
    saveConfig(c);
  };

  const isRunning = timer.state.phase !== "idle";

  return (
    <main className="flex h-dvh flex-col">
      {isRunning ? (
        <TimerScreen
          state={timer.state}
          config={config}
          onPause={timer.pause}
          onResume={timer.resume}
          onSkip={timer.skip}
          onStop={timer.stop}
        />
      ) : (
        <SettingsScreen
          config={config}
          onChange={updateConfig}
          onStart={() => timer.start(config)}
        />
      )}
    </main>
  );
}
