"use client";

import { useMemo } from "react";

const CONFETTI_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#ec4899",
  "#a855f7",
  "#ef4444",
];

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: rand(i + 1) * 100,
        delay: rand(i + 7) * 0.6,
        duration: 2.4 + rand(i + 13) * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: rand(i + 21) * 360,
        size: 6 + rand(i + 31) * 7,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`@keyframes envi-confetti{0%{transform:translateY(-12vh) rotate(0deg);opacity:1}100%{transform:translateY(112vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-12vh",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `envi-confetti ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}