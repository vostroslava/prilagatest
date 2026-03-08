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
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between px-2 text-[12px] uppercase tracking-[0.2em] font-medium text-white/40">
        <span>Совсем не похоже</span>
        <span>Очень похоже</span>
      </div>

      <div 
        className={cn(
          "flex items-stretch justify-between h-24 sm:h-32 w-full gap-2 p-2 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {STANDARD_LIKERT_OPTIONS.map((option) => {
          const active = option.value === value;
          const isExtreme = option.value === 1 || option.value === 5;
          const isNeutral = option.value === 3;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center rounded-[1.5rem] transition-all duration-500 ease-out group outline-none",
                active 
                  ? "bg-primary/20 border border-primary/30 shadow-[0_0_30px_rgba(120,200,200,0.15)] scale-[1.02]" 
                  : "bg-transparent border border-transparent hover:bg-white/5"
              )}
            >
              <div 
                className={cn(
                  "size-2.5 rounded-full transition-all duration-300 mb-3",
                  active 
                    ? "bg-primary shadow-[0_0_10px_currentColor] scale-100" 
                    : isNeutral
                      ? "bg-white/10 scale-75"
                      : isExtreme
                        ? "bg-white/25 scale-75 group-hover:scale-100"
                        : "bg-white/20 scale-75 group-hover:scale-100"
                )}
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-300 px-2 text-center leading-tight",
                active ? "text-primary opacity-100 translate-y-0" : "text-white/40 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
              )}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
