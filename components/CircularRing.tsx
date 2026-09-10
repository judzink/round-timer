"use client";

import type { ReactNode } from "react";

type Props = {
  /** 0..1 — koliko prstena je preostalo (1 = pun, 0 = prazan) */
  progress: number;
  /** Boja aktivnog dela prstena */
  color: string;
  children?: ReactNode;
  size?: number;
  strokeWidth?: number;
};

/** SVG kružni prsten koji se prazni kako vreme ističe. */
export default function CircularRing({
  progress,
  color,
  children,
  size = 300,
  strokeWidth = 16,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="relative"
      style={{ width: "min(78vw, 78vh, 460px)", aspectRatio: "1 / 1" }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-zinc-800"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
