"use client";

import { estimateTotalSeconds, type Config, type VoiceLang } from "@/lib/types";
import { formatMMSS } from "@/lib/format";
import Stepper from "./Stepper";

type Props = {
  config: Config;
  onChange: (config: Config) => void;
  onStart: () => void;
};

function Toggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition-colors select-none ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-zinc-800 text-zinc-400 active:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

export default function SettingsScreen({ config, onChange, onStart }: Props) {
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  const total = estimateTotalSeconds(config);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <header className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-white">
              🥊 BOKS TAJMER
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Podesi rundu i kreni sa treningom
            </p>
          </header>

          {/* Glavna podešavanja */}
          <section className="flex flex-col gap-5 rounded-2xl bg-zinc-900/70 p-5">
            <Stepper
              label="Broj rundi"
              value={config.rounds}
              onChange={(v) => set({ rounds: v })}
              min={1}
              max={99}
            />
            <Stepper
              label="Trajanje runde"
              value={config.roundSeconds}
              onChange={(v) => set({ roundSeconds: v })}
              min={5}
              max={3600}
              step={5}
              format={formatMMSS}
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-medium text-zinc-300">
                Pauza između rundi
              </span>
              <button
                type="button"
                onClick={() => set({ restEnabled: !config.restEnabled })}
                aria-pressed={config.restEnabled}
                className={`relative h-9 w-16 rounded-full transition-colors select-none ${
                  config.restEnabled ? "bg-emerald-600" : "bg-zinc-700"
                }`}
                aria-label="Uključi/isključi pauzu"
              >
                <span
                  className={`absolute top-1 h-7 w-7 rounded-full bg-white transition-all ${
                    config.restEnabled ? "left-8" : "left-1"
                  }`}
                />
              </button>
            </div>

            <Stepper
              label="Trajanje pauze"
              value={config.restSeconds}
              onChange={(v) => set({ restSeconds: v })}
              min={5}
              max={1800}
              step={5}
              format={formatMMSS}
              disabled={!config.restEnabled}
            />
          </section>

          {/* Najave */}
          <section className="flex flex-col gap-5 rounded-2xl bg-zinc-900/70 p-5">
            <Stepper
              label='"Spremi se" pre starta'
              value={config.prepSeconds}
              onChange={(v) => set({ prepSeconds: v })}
              min={0}
              max={60}
              format={(v) => `${v}s`}
            />
            <Stepper
              label="Upozorenje pred kraj"
              value={config.warningSeconds}
              onChange={(v) => set({ warningSeconds: v })}
              min={0}
              max={Math.max(0, config.roundSeconds - 1)}
              format={(v) => `${v}s`}
            />
          </section>

          {/* Zvuk / glas / vibracija */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900/70 p-5">
            <div className="flex gap-3">
              <Toggle
                label="🔔 Zvuk"
                active={config.soundEnabled}
                onToggle={() => set({ soundEnabled: !config.soundEnabled })}
              />
              <Toggle
                label="🗣️ Glas"
                active={config.voiceEnabled}
                onToggle={() => set({ voiceEnabled: !config.voiceEnabled })}
              />
              <Toggle
                label="📳 Vibracija"
                active={config.vibrationEnabled}
                onToggle={() =>
                  set({ vibrationEnabled: !config.vibrationEnabled })
                }
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-medium text-zinc-300">
                Jezik glasa
              </span>
              <div className="flex gap-2">
                {(["sr", "en"] as VoiceLang[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => set({ voiceLang: lang })}
                    className={`w-16 rounded-xl py-2 text-sm font-bold uppercase transition-colors select-none ${
                      config.voiceLang === lang
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-800 text-zinc-400 active:bg-zinc-700"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <p className="text-center text-sm text-zinc-500">
            Ukupno ≈ {formatMMSS(total)} min
          </p>
        </div>
      </div>

      {/* Start */}
      <div className="border-t border-zinc-800 bg-zinc-950/80 px-5 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onStart}
          className="mx-auto block w-full max-w-md rounded-2xl bg-emerald-600 py-5 text-xl font-black tracking-wide text-white active:bg-emerald-700 select-none"
        >
          START
        </button>
      </div>
    </div>
  );
}
