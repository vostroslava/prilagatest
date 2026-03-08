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
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.24em] font-medium text-muted-foreground">
        <span>Совсем не похоже</span>
        <span>Очень похоже</span>
      </div>

      <div
        className={cn(
          "panel-inset-strong grid w-full grid-cols-5 gap-2 rounded-[2rem] p-2.5 sm:p-3",
          disabled && "pointer-events-none opacity-65"
        )}
      >
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
                "group relative flex min-h-28 flex-col items-center justify-between rounded-[1.5rem] border px-3 py-3 text-center outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-32 sm:px-4 sm:py-4",
                active
                  ? "border-primary/40 bg-primary/12 text-foreground ring-1 ring-primary/35 shadow-[0_14px_36px_var(--surface-glow)]"
                  : "border-[color:var(--surface-border)] bg-[var(--surface-control)] text-muted-foreground hover:border-[color:var(--surface-border-strong)] hover:bg-[var(--surface-control-hover)] hover:text-foreground"
              )}
            >
              <div className="flex w-full flex-col items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                    active
                      ? "border-primary/40 bg-primary/18 text-primary"
                      : "border-[color:var(--surface-border)] bg-[var(--surface-inset)] text-foreground/78",
                  )}
                >
                  {option.label}
                </span>
                <div
                  className={cn(
                    "size-2.5 rounded-full transition-all duration-200",
                    active
                      ? "bg-primary shadow-[0_0_12px_currentColor]"
                      : "bg-muted-foreground/40 group-hover:bg-primary/50",
                  )}
                />
              </div>

              <div className="mt-4 flex w-full flex-1 items-end justify-center">
                <span
                  className={cn(
                    "text-sm leading-5 transition-colors",
                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/90",
                  )}
                >
                  {option.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
