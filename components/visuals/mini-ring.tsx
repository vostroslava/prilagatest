"use client";

import { cn } from "@/lib/utils";

interface MiniRingProps {
  value: number;
  label?: string;
  size?: number;
  className?: string;
}

export function MiniRing({
  value,
  label,
  size = 70,
  className,
}: MiniRingProps) {
  const clamped = Math.max(0, Math.min(value, 100));

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-[color:var(--surface-border)] shadow-[var(--surface-shadow-soft)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(color-mix(in srgb, var(--primary) 92%, white 8%) 0deg, color-mix(in srgb, var(--primary) 92%, white 8%) ${clamped * 3.6}deg, var(--progress-track) ${clamped * 3.6}deg, var(--progress-track) 360deg)`,
      }}
    >
      <div
        className="absolute rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-inset-strong)] backdrop-blur-md"
        style={{ inset: 6 }}
      />
      <div className="relative text-center">
        <div className="text-xl font-semibold tracking-tight text-foreground">{clamped}%</div>
        {label ? (
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
