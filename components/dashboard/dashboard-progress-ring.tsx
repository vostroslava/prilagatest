import * as React from "react";

import { cn } from "@/lib/utils";

interface DashboardProgressRingProps {
  value: number;
  className?: string;
}

export function DashboardProgressRing({
  value,
  className,
}: DashboardProgressRingProps) {
  const gradientId = React.useId().replaceAll(":", "");
  const clamped = Math.max(0, Math.min(value, 100));
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn(
        "relative flex size-[4.5rem] items-center justify-center rounded-full border border-white/8 bg-[rgba(8,14,22,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={`url(#dashboard-ring-gradient-${gradientId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id={`dashboard-ring-gradient-${gradientId}`} x1="0" y1="0" x2="72" y2="72">
            <stop offset="0%" stopColor="#63f0de" />
            <stop offset="100%" stopColor="#18b8aa" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-sm font-semibold tracking-tight text-white">
        {clamped}%
      </span>
    </div>
  );
}
