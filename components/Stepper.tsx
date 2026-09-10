"use client";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  disabled?: boolean;
};

/** Kontrola [−] vrednost [+] sa velikim touch dugmićima. */
export default function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  format,
  disabled = false,
}: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));
  const display = format ? format(value) : String(value);

  const btn =
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-2xl font-bold text-zinc-100 " +
    "active:bg-zinc-700 disabled:opacity-30 disabled:active:bg-zinc-800 select-none";

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <span className="text-base font-medium text-zinc-300">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={btn}
          onClick={dec}
          disabled={disabled || value <= min}
          aria-label={`${label} smanji`}
        >
          −
        </button>
        <span className="font-timer w-20 text-center text-2xl font-bold tabular-nums text-white">
          {display}
        </span>
        <button
          type="button"
          className={btn}
          onClick={inc}
          disabled={disabled || value >= max}
          aria-label={`${label} povećaj`}
        >
          +
        </button>
      </div>
    </div>
  );
}
