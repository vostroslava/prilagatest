"use client";

import { STANDARD_LIKERT_OPTIONS } from "@/content/tests/version";
import { cn } from "@/lib/utils";
import type { LikertValue } from "@/types/assessment";

interface LikertScaleProps {
  value: LikertValue | null;
  onChange: (value: LikertValue) => void;
  disabled?: boolean;
}

export function LikertScale({ value, onChange, disabled = false }: LikertScaleProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        <span>Совсем не про меня</span>
        <span>Точно про меня</span>
      </div>

      <div className={cn("space-y-3", disabled && "pointer-events-none opacity-65")}>
        {STANDARD_LIKERT_OPTIONS.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "group dashboard-card-soft relative flex min-h-[4.65rem] w-full items-center justify-center overflow-hidden rounded-[1.65rem] border px-6 py-4 text-center outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-[4.95rem]",
                active
                  ? "border-cyan-300/35 bg-[linear-gradient(90deg,rgba(45,211,191,0.18),rgba(255,255,255,0.03),rgba(45,211,191,0.24))] text-foreground ring-1 ring-cyan-300/25 shadow-[0_16px_34px_rgba(45,211,191,0.14)]"
                  : "border-white/10 bg-white/5 text-foreground/92 hover:-translate-y-0.5 hover:border-cyan-300/18 hover:bg-white/[0.06] hover:text-foreground"
              )}
            >
              <div className="absolute inset-y-0 left-0 w-24 bg-[radial-gradient(circle_at_left,rgba(89,241,213,0.14),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-aria-pressed:opacity-100" />
              <div className="absolute inset-y-0 right-0 w-28 bg-[radial-gradient(circle_at_right,rgba(89,241,213,0.2),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-aria-pressed:opacity-100" />

              <span
                className={cn(
                  "relative text-[1.15rem] tracking-tight transition-colors sm:text-[1.5rem]",
                  active ? "text-foreground" : "text-foreground/88 group-hover:text-foreground",
                )}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
