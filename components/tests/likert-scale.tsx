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
                "group relative flex min-h-[4.35rem] w-full items-center justify-center overflow-hidden rounded-[1.45rem] border px-6 py-4 text-center outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-[4.65rem]",
                active
                  ? "border-primary/40 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--primary)_14%,transparent),color-mix(in_srgb,var(--primary)_20%,transparent),color-mix(in_srgb,var(--primary)_30%,transparent))] text-foreground ring-1 ring-primary/35 shadow-[0_16px_34px_var(--surface-glow)]"
                  : "border-[color:var(--surface-border)] bg-[var(--surface-control)] text-foreground/90 hover:-translate-y-0.5 hover:border-[color:var(--surface-border-strong)] hover:bg-[var(--surface-control-hover)] hover:text-foreground"
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
