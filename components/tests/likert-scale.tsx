"use client";

import { Check } from "lucide-react";

import { STANDARD_LIKERT_OPTIONS } from "@/content/tests/version";
import { cn } from "@/lib/utils";
import type { LikertValue } from "@/types/assessment";

interface LikertScaleProps {
  value: LikertValue | null;
  onChange: (value: LikertValue) => void;
  disabled?: boolean;
}

const OPTION_TITLES: Record<LikertValue, string> = {
  1: "Совсем нет",
  2: "Скорее нет",
  3: "Неоднозначно",
  4: "Скорее да",
  5: "Очень похоже",
};

export function LikertScale({ value, onChange, disabled = false }: LikertScaleProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.26em] text-muted-foreground/80">
        <span>Совсем не похоже</span>
        <span>Очень похоже</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {STANDARD_LIKERT_OPTIONS.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              className={cn(
                "group relative min-h-28 overflow-hidden rounded-[1.75rem] border px-4 py-4 text-left transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0",
                active
                  ? "border-primary/55 bg-primary/12 text-foreground shadow-[0_24px_80px_rgba(52,124,122,0.18)]"
                  : "border-white/7 bg-white/[0.03] text-foreground/90 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
                disabled && "pointer-events-none opacity-70",
              )}
              onClick={() => onChange(option.value)}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] opacity-0 transition-opacity duration-300",
                  active && "opacity-100",
                )}
              />

              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border transition-all duration-300",
                      active
                        ? "border-primary/60 bg-primary/20 text-primary"
                        : "border-white/10 text-transparent group-hover:border-white/20",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-base font-semibold tracking-tight sm:text-lg">
                    {OPTION_TITLES[option.value]}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs tracking-[0.18em] text-muted-foreground/70 uppercase">
        Ответ сохраняется сразу
      </p>
    </div>
  );
}
