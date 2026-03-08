"use client";

import { cn } from "@/lib/utils";

interface MetricBarProps {
  label: string;
  value: number;
  className?: string;
  muted?: boolean;
}

export function MetricBar({ label, value, className, muted = false }: MetricBarProps) {
  const clamped = Math.max(0, Math.min(value, 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-medium text-muted-foreground">{clamped}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--progress-track)" }}>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            muted
              ? "shadow-none"
              : "shadow-[0_0_18px_var(--surface-glow)]",
          )}
          style={{
            width: `${clamped}%`,
            background: muted ? "var(--progress-fill-muted)" : "var(--progress-fill)",
          }}
        />
      </div>
    </div>
  );
}
