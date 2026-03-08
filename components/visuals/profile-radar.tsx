"use client";

import * as React from "react";

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

interface CartesianPoint {
  x: number;
  y: number;
}

interface ChartVertex {
  label: string;
  labelPosition: CartesianPoint;
  outerPosition: CartesianPoint;
  primaryPosition: CartesianPoint;
  secondaryPosition: CartesianPoint | null;
  value: number;
  secondaryValue: number | null;
}

const VIEWBOX_SIZE = 100;
const CHART_CENTER = 50;
const OUTER_RADIUS = 30;
const LABEL_RADIUS = 41.5;
const GRID_LEVELS = 5;

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100));
}

function toRadians(angle: number) {
  return ((angle - 90) * Math.PI) / 180;
}

function polarToCartesian(angle: number, radius: number): CartesianPoint {
  const radians = toRadians(angle);

  return {
    x: CHART_CENTER + Math.cos(radians) * radius,
    y: CHART_CENTER + Math.sin(radians) * radius,
  };
}

function pointsToString(points: CartesianPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function buildVertices(data: RadarPoint[]) {
  if (!data.length) {
    return [];
  }

  return data.map((point, index) => {
    const angle = (index / data.length) * 360;
    const primaryValue = clampPercent(point.value);
    const normalizedSecondary =
      typeof point.secondaryValue === "number" ? clampPercent(point.secondaryValue) : null;

    return {
      label: point.label,
      labelPosition: polarToCartesian(angle, LABEL_RADIUS),
      outerPosition: polarToCartesian(angle, OUTER_RADIUS),
      primaryPosition: polarToCartesian(angle, (OUTER_RADIUS * primaryValue) / 100),
      secondaryPosition:
        normalizedSecondary === null
          ? null
          : polarToCartesian(angle, (OUTER_RADIUS * normalizedSecondary) / 100),
      value: primaryValue,
      secondaryValue: normalizedSecondary,
    } satisfies ChartVertex;
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
  const vertices = React.useMemo(() => buildVertices(data), [data]);

  const hasData = vertices.length > 0;
  const hasSecondary = vertices.some((point) => point.secondaryPosition !== null);

  const gridPolygons = React.useMemo(
    () =>
      Array.from({ length: GRID_LEVELS }, (_, index) => {
        const ratio = (index + 1) / GRID_LEVELS;
        const points = vertices.map((vertex, vertexIndex) =>
          polarToCartesian((vertexIndex / vertices.length) * 360, OUTER_RADIUS * ratio),
        );

        return pointsToString(points);
      }),
    [vertices],
  );

  const primaryPolygon = React.useMemo(
    () => pointsToString(vertices.map((vertex) => vertex.primaryPosition)),
    [vertices],
  );

  const secondaryPolygon = React.useMemo(
    () =>
      pointsToString(
        vertices.map((vertex) => vertex.secondaryPosition ?? vertex.primaryPosition),
      ),
    [vertices],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--surface-border)] bg-[var(--radar-background)] shadow-[var(--surface-shadow-soft)]",
        className,
      )}
      style={{ height }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--surface-glow),transparent_28%),radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.04),transparent_50%)]" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
        style={{ background: "var(--hero-orb)" }}
      />

      <div className="relative h-full w-full">
        {hasData ? (
          <svg
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            className="h-full w-full"
            role="img"
            aria-label={`${primaryLabel}${secondaryLabel ? ` и ${secondaryLabel}` : ""}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={`radar-fill-${token}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryStroke} stopOpacity="0.72" />
                <stop offset="100%" stopColor={primaryStroke} stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id={`radar-secondary-${token}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={secondaryStroke} stopOpacity="0.28" />
                <stop offset="100%" stopColor={secondaryStroke} stopOpacity="0.05" />
              </linearGradient>
              <filter id={`radar-glow-${token}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {gridPolygons.map((polygon, index) => (
              <polygon
                key={`grid-${index + 1}`}
                points={polygon}
                fill="none"
                stroke="var(--radar-grid)"
                strokeWidth={index === gridPolygons.length - 1 ? 0.45 : 0.35}
              />
            ))}

            {vertices.map((vertex) => (
              <line
                key={`spoke-${vertex.label}`}
                x1={CHART_CENTER}
                y1={CHART_CENTER}
                x2={vertex.outerPosition.x}
                y2={vertex.outerPosition.y}
                stroke="var(--radar-grid)"
                strokeWidth="0.3"
              />
            ))}

            {hasSecondary ? (
              <polygon
                points={secondaryPolygon}
                fill={`url(#radar-secondary-${token})`}
                stroke={secondaryStroke}
                strokeWidth="0.7"
              />
            ) : null}

            <polygon
              points={primaryPolygon}
              fill={`url(#radar-fill-${token})`}
              stroke={primaryStroke}
              strokeWidth="0.95"
              filter={`url(#radar-glow-${token})`}
            />

            {vertices.map((vertex) =>
              vertex.secondaryPosition ? (
                <circle
                  key={`secondary-dot-${vertex.label}`}
                  cx={vertex.secondaryPosition.x}
                  cy={vertex.secondaryPosition.y}
                  r="0.7"
                  fill={secondaryStroke}
                  opacity="0.8"
                />
              ) : null,
            )}

            {vertices.map((vertex) => (
              <circle
                key={`primary-dot-${vertex.label}`}
                cx={vertex.primaryPosition.x}
                cy={vertex.primaryPosition.y}
                r="0.88"
                fill={primaryStroke}
                filter={`url(#radar-glow-${token})`}
              />
            ))}
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-square w-[70%] max-w-[320px] rounded-full border border-[color:var(--radar-grid)]">
              <div className="absolute inset-[12%] rounded-full border border-[color:var(--radar-grid)]" />
              <div className="absolute inset-[24%] rounded-full border border-[color:var(--radar-grid)]" />
              <div className="absolute inset-[36%] rounded-full border border-[color:var(--radar-grid)]" />
              <div
                className="absolute inset-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm"
                style={{ background: "var(--hero-orb)" }}
              />
            </div>
          </div>
        )}
      </div>

      {showLabels && hasData ? (
        <div className="pointer-events-none absolute inset-0">
          {vertices.map((vertex) => (
            <div
              key={`label-${vertex.label}`}
              className="absolute max-w-[6.5rem] -translate-x-1/2 -translate-y-1/2 px-2 text-center text-[10px] font-medium leading-4 text-[color:var(--radar-label)] sm:text-[11px]"
              style={{
                left: `${vertex.labelPosition.x}%`,
                top: `${vertex.labelPosition.y}%`,
              }}
            >
              {vertex.label}
            </div>
          ))}
        </div>
      ) : null}

      {centerLabel || centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="quiet-panel rounded-full border-[color:var(--surface-border-strong)] px-5 py-3 text-center shadow-[0_0_46px_var(--surface-glow)] backdrop-blur-xl">
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
