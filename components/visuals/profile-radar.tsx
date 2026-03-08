"use client";

import * as React from "react";
import {
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { cn } from "@/lib/utils";

interface RadarPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface ProfileRadarProps {
  data: RadarPoint[];
  height?: number;
  className?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryStroke?: string;
  secondaryStroke?: string;
  centerLabel?: string;
  centerValue?: string;
  showLabels?: boolean;
}

function RadarTooltip({
  active,
  payload,
  label,
  primaryLabel,
  secondaryLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: string | number; value?: number | string }>;
  label?: string | number;
  primaryLabel: string;
  secondaryLabel?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const primaryValue = payload.find((entry) => entry.dataKey === "value")?.value;
  const secondaryValue = payload.find((entry) => entry.dataKey === "secondaryValue")?.value;

  return (
    <div className="rounded-[1.25rem] border border-[color:var(--surface-border-strong)] bg-[var(--radar-tooltip)] px-4 py-3 shadow-[var(--surface-shadow-soft)] backdrop-blur-xl">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>
          {primaryLabel}: {primaryValue ?? "—"}
        </p>
        {secondaryLabel ? (
          <p>
            {secondaryLabel}: {secondaryValue ?? "—"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function buildLabelPositions(data: RadarPoint[]) {
  if (!data.length) {
    return [];
  }

  return data.map((point, index) => {
    const angle = ((index * 360) / data.length - 90) * (Math.PI / 180);
    const radius = 40;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;

    return {
      label: point.label,
      x,
      y,
    };
  });
}

export function ProfileRadar({
  data,
  height = 360,
  className,
  primaryLabel = "Профиль",
  secondaryLabel,
  primaryStroke = "var(--primary)",
  secondaryStroke = "var(--radar-secondary)",
  centerLabel,
  centerValue,
  showLabels = true,
}: ProfileRadarProps) {
  const token = React.useId().replaceAll(":", "");
  const [isMounted, setIsMounted] = React.useState(false);
  const hasSecondary = data.some((point) => typeof point.secondaryValue === "number");
  const labelPositions = React.useMemo(() => buildLabelPositions(data), [data]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--surface-border)] bg-[var(--radar-background)] shadow-[var(--surface-shadow-soft)]",
        className,
      )}
      style={{ height }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--surface-glow),transparent_28%),radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.05),transparent_50%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl" style={{ background: "var(--hero-orb)" }} />

      <div className="relative h-full w-full">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="67%">
              <defs>
                <linearGradient id={`radar-fill-${token}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={primaryStroke} stopOpacity={0.72} />
                  <stop offset="100%" stopColor={primaryStroke} stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id={`radar-secondary-${token}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={secondaryStroke} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={secondaryStroke} stopOpacity={0.04} />
                </linearGradient>
                <filter id={`radar-glow-${token}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <PolarGrid stroke="var(--radar-grid)" radialLines={false} />

              {hasSecondary ? (
                <Radar
                  dataKey="secondaryValue"
                  stroke={secondaryStroke}
                  strokeWidth={1.6}
                  fill={`url(#radar-secondary-${token})`}
                  fillOpacity={1}
                />
              ) : null}

              <Radar
                dataKey="value"
                stroke={primaryStroke}
                strokeWidth={2.2}
                fill={`url(#radar-fill-${token})`}
                fillOpacity={1}
                filter={`url(#radar-glow-${token})`}
              />

              <Tooltip
                content={({ active, payload, label }) => (
                  <RadarTooltip
                    active={active}
                    payload={payload as ReadonlyArray<{ dataKey?: string | number; value?: number | string }> | undefined}
                    label={label}
                    primaryLabel={primaryLabel}
                    secondaryLabel={secondaryLabel}
                  />
                )}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-square w-[70%] max-w-[320px] rounded-full border border-[color:var(--radar-grid)]">
              <div className="absolute inset-[12%] rounded-full border border-[color:var(--radar-grid)]" />
              <div className="absolute inset-[24%] rounded-full border border-[color:var(--radar-grid)]" />
              <div className="absolute inset-[36%] rounded-full border border-[color:var(--radar-grid)]" />
              <div className="absolute inset-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm" style={{ background: "var(--hero-orb)" }} />
            </div>
          </div>
        )}
      </div>

      {showLabels ? (
        <div className="pointer-events-none absolute inset-0">
          {labelPositions.map((point) => (
            <div
              key={point.label}
              className="absolute max-w-[7rem] -translate-x-1/2 -translate-y-1/2 px-2 text-center text-[11px] font-medium leading-4 text-[color:var(--radar-label)] sm:text-xs"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              {point.label}
            </div>
          ))}
        </div>
      ) : null}

      {centerLabel || centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-[color:var(--surface-border-strong)] bg-[var(--surface-control)] px-5 py-3 text-center shadow-[0_0_60px_var(--surface-glow)] backdrop-blur-xl">
            {centerValue ? (
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {centerValue}
              </div>
            ) : null}
            {centerLabel ? (
              <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                {centerLabel}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
