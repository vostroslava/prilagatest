"use client";

import * as React from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createComparisonPackage, generateComparisonMarkdown } from "@/lib/export/comparison-package";
import { downloadBlob, slugify } from "@/lib/export/download";
import { validateProfileExport } from "@/lib/export/profile-schema";
import { contextLabel } from "@/lib/presenters";
import { cn } from "@/lib/utils";
import type { BlockId } from "@/types/assessment";
import type { ComparisonResponseDifference, ComparisonScaleDifference } from "@/types/export";
import type { FullProfileExport } from "@/types/profile";

const BLOCK_META: Record<
  BlockId,
  {
    title: string;
    subtitle: string;
    tint: string;
    softTint: string;
  }
> = {
  "big-five": {
    title: "Большая пятёрка",
    subtitle: "Общий темперамент и базовый рисунок личности.",
    tint: "rgba(104,211,203,1)",
    softTint: "rgba(104,211,203,0.18)",
  },
  "ipip-ipc": {
    title: "Межличностный стиль",
    subtitle: "Как два человека входят в контакт, держат дистанцию и занимают пространство.",
    tint: "rgba(232,170,102,1)",
    softTint: "rgba(232,170,102,0.18)",
  },
  "conflict-profile": {
    title: "Конфликтный профиль",
    subtitle: "Как проявляются напряжение, защита, замолкание и восстановление.",
    tint: "rgba(130,196,147,1)",
    softTint: "rgba(130,196,147,0.18)",
  },
};

function getBlockChartData(
  blockId: BlockId,
  leftProfile: FullProfileExport,
  rightProfile: FullProfileExport,
) {
  return leftProfile.scoring[blockId].map((score) => {
    const rightScore = rightProfile.scoring[blockId].find((entry) => entry.key === score.key);

    return {
      name: score.shortLabel,
      left: score.normalized ?? 0,
      right: rightScore?.normalized ?? 0,
    };
  });
}

function renderRadarTooltip(
  active: boolean | undefined,
  payload:
    | ReadonlyArray<{ dataKey?: string | number; value?: number | string }>
    | undefined,
  label: string | number | undefined,
  leftName: string,
  rightName: string,
) {
  if (!active || !payload?.length) {
    return null;
  }

  const leftValue = payload.find((entry) => entry.dataKey === "left")?.value;
  const rightValue = payload.find((entry) => entry.dataKey === "right")?.value;

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#0d1012]/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>
          {leftName}: {leftValue ?? "—"}
        </p>
        <p>
          {rightName}: {rightValue ?? "—"}
        </p>
      </div>
    </div>
  );
}

function DifferenceMeter({
  row,
  leftName,
  rightName,
}: {
  row: ComparisonScaleDifference;
  leftName: string;
  rightName: string;
}) {
  const difference = row.absoluteDifference ?? 0;
  const indicatorWidth = `${Math.min(difference, 100)}%`;

  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-tight text-foreground">{row.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground/70">
            {row.direction === "equal"
              ? "Почти на одной ноте"
              : row.direction === "left-higher"
                ? `${leftName} выражен сильнее`
                : row.direction === "right-higher"
                  ? `${rightName} выражен сильнее`
                  : "Недостаточно данных"}
          </p>
        </div>
        <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm shadow-none">
          {row.absoluteDifference ?? "—"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px_1fr] sm:items-center">
        <div className="rounded-[1.15rem] border border-white/6 bg-white/[0.03] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
            {leftName}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {row.leftValue ?? "—"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(105,211,205,0.92),rgba(236,169,103,0.92))]"
              style={{ width: indicatorWidth }}
            />
          </div>
          <p className="text-center text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
            дистанция
          </p>
        </div>

        <div className="rounded-[1.15rem] border border-white/6 bg-white/[0.03] px-3 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
            {rightName}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {row.rightValue ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResponseCard({
  row,
  leftName,
  rightName,
}: {
  row: ComparisonResponseDifference;
  leftName: string;
  rightName: string;
}) {
  const intensity = row.absoluteDifference === null ? 0 : Math.min(row.absoluteDifference * 25, 100);

  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground/65">
            {row.itemId} · {row.scaleKey}
          </p>
          <p className="text-sm leading-7 text-foreground/90">{row.question}</p>
        </div>
        <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm shadow-none">
          {row.absoluteDifference ?? "—"}
        </Badge>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(105,211,205,0.88),rgba(236,169,103,0.88))]"
          style={{ width: `${intensity}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.1rem] border border-white/6 bg-white/[0.03] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
            {leftName}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {row.leftAnswer ?? "—"}
          </p>
        </div>
        <div className="rounded-[1.1rem] border border-white/6 bg-white/[0.03] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
            {rightName}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {row.rightAnswer ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CompareWorkspace() {
  const { profiles } = useProfiles();
  const [leftProfile, setLeftProfile] = React.useState<FullProfileExport | null>(null);
  const [rightProfile, setRightProfile] = React.useState<FullProfileExport | null>(null);
  const [error, setError] = React.useState<string>("");

  const comparison = React.useMemo(() => {
    if (!leftProfile || !rightProfile) {
      return null;
    }

    return createComparisonPackage(leftProfile, rightProfile);
  }, [leftProfile, rightProfile]);

  async function loadFromFile(
    side: "left" | "right",
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const parsed = validateProfileExport(JSON.parse(await file.text()));

      if (side === "left") {
        setLeftProfile(parsed);
      } else {
        setRightProfile(parsed);
      }

      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить экспорт.");
    } finally {
      event.target.value = "";
    }
  }

  function loadFromLocal(side: "left" | "right", profileId: string) {
    const profile = profiles.find((entry) => entry.profileMeta.id === profileId);
    if (!profile) {
      return;
    }

    if (side === "left") {
      setLeftProfile(profile);
    } else {
      setRightProfile(profile);
    }

    setError("");
  }

  const filenameBase =
    comparison &&
    `${slugify(comparison.leftProfile.profileMeta.displayName)}-vs-${slugify(comparison.rightProfile.profileMeta.displayName)}`;

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2.75rem] border border-white/6 bg-[#09090b]/88 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(76,169,165,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(190,147,86,0.18),transparent_24%)]" />

        <div className="relative px-6 py-7 sm:px-8 sm:py-9">
          <div className="max-w-4xl space-y-5">
            <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
              Парный анализ без автоматического вердикта
            </Badge>
            <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
              Сравнить два полных профиля рядом и подготовить пакет для ручного разбора.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-foreground/85 sm:text-lg">
              В этом режиме продукт не говорит, подходят ли люди друг другу. Он
              аккуратно показывает полные данные, различия по шкалам, совпадения по
              паттернам ответа и затем собирает comparison-package для внешнего анализа.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {([
          ["left", leftProfile, "Профиль 1", "Выберите первого человека или загрузите его JSON."],
          ["right", rightProfile, "Профиль 2", "Выберите второго человека или загрузите его JSON."],
        ] as const).map(([side, profile, title, description]) => (
          <Card
            key={side}
            className="glass-panel relative overflow-hidden border-white/8 bg-white/[0.04]"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-80",
                side === "left"
                  ? "bg-[radial-gradient(circle_at_top_left,rgba(82,170,166,0.18),transparent_32%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(196,145,82,0.18),transparent_32%)]",
              )}
            />

            <CardHeader className="relative">
              <CardTitle className="font-display text-3xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              <Select onValueChange={(value) => loadFromLocal(side, String(value))}>
                <SelectTrigger className="rounded-full border-white/10 bg-white/[0.04]">
                  <SelectValue placeholder="Выбрать из локальных профилей" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profileOption) => (
                    <SelectItem key={profileOption.profileMeta.id} value={profileOption.profileMeta.id}>
                      {profileOption.profileMeta.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex cursor-pointer items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-white/25 hover:bg-white/[0.05] hover:text-foreground">
                Загрузить JSON-экспорт
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => void loadFromFile(side, event)}
                />
              </label>

              {profile ? (
                <div className="rounded-[1.65rem] border border-white/8 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                      {profile.profileMeta.status === "ready" ? "Готов" : "Черновик"}
                    </Badge>
                    <Badge className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                      {profile.profileMeta.contexts.map(contextLabel).join(", ") || "без контекста"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                    {profile.profileMeta.displayName}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {profile.textualInterpretation.shortProfile}
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.65rem] border border-white/8 bg-black/20 p-5 text-sm leading-7 text-muted-foreground">
                  Пока профиль не выбран. После загрузки здесь появится короткий портрет,
                  чтобы экран сравнения сразу ощущался как разговор двух живых профилей.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <Card className="glass-panel border-destructive/30 bg-destructive/8">
          <CardContent className="py-4 text-sm text-foreground">{error}</CardContent>
        </Card>
      ) : null}

      {comparison ? (
        <>
          <section className="relative isolate overflow-hidden rounded-[2.75rem] border border-white/6 bg-[#09090b]/88 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(84,171,167,0.18),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(198,149,89,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_28%)]" />

            <div className="relative space-y-6 px-6 py-7 sm:px-8 sm:py-9">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl space-y-4">
                  <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                    {comparison.leftProfile.profileMeta.displayName} vs {comparison.rightProfile.profileMeta.displayName}
                  </Badge>
                  <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
                    Два профиля лицом к лицу
                  </h2>
                  <p className="text-base leading-8 text-foreground/84">
                    {comparison.summary.overview}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full border border-white/10 bg-white/[0.08] px-5 hover:bg-white/[0.12]"
                    onClick={() =>
                      downloadBlob(
                        `${filenameBase}-comparison-package.json`,
                        JSON.stringify(comparison, null, 2),
                        "application/json",
                      )
                    }
                  >
                    Подготовить пакет JSON
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/8 bg-white/[0.03] px-5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                    onClick={() =>
                      downloadBlob(
                        `${filenameBase}-comparison-package.md`,
                        generateComparisonMarkdown(comparison),
                        "text/markdown;charset=utf-8",
                      )
                    }
                  >
                    Подготовить пакет Markdown
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                {[comparison.leftProfile, comparison.rightProfile].map((profile, index) => (
                  <div
                    key={profile.profileMeta.id}
                    className={cn(
                      "rounded-[2rem] border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
                      index === 0
                        ? "border-emerald-300/12 bg-emerald-300/6"
                        : "border-amber-300/12 bg-amber-300/6",
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                      {index === 0 ? "Левый профиль" : "Правый профиль"}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                      {profile.profileMeta.displayName}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {profile.textualInterpretation.shortProfile}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="glass-panel border-white/8 bg-white/[0.04]">
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Наиболее близкие зоны</CardTitle>
                    <CardDescription>
                      Шкалы, где различие минимально и рисунок выглядит похожим.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {comparison.summary.closestScales.map((row) => (
                      <DifferenceMeter
                        key={`closest-${row.blockId}-${row.scaleKey}`}
                        row={row}
                        leftName={comparison.leftProfile.profileMeta.displayName}
                        rightName={comparison.rightProfile.profileMeta.displayName}
                      />
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-panel border-white/8 bg-white/[0.04]">
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Наиболее заметные расхождения</CardTitle>
                    <CardDescription>
                      Это не приговор, а просто точки, которые полезно обсуждать внимательнее.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {comparison.summary.furthestScales.map((row) => (
                      <DifferenceMeter
                        key={`furthest-${row.blockId}-${row.scaleKey}`}
                        row={row}
                        leftName={comparison.leftProfile.profileMeta.displayName}
                        rightName={comparison.rightProfile.profileMeta.displayName}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <Tabs defaultValue="big-five" className="space-y-6">
            <TabsList className="w-full flex-wrap rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-2">
              {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => (
                <TabsTrigger key={blockId} value={blockId} className="rounded-full px-5">
                  {BLOCK_META[blockId].title}
                </TabsTrigger>
              ))}
            </TabsList>

            {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => {
              const blockMeta = BLOCK_META[blockId];
              const chartData = getBlockChartData(blockId, comparison.leftProfile, comparison.rightProfile);
              const chartToken = `${blockId}-${comparison.leftProfile.profileMeta.id.slice(0, 4)}-${comparison.rightProfile.profileMeta.id.slice(0, 4)}`;
              const comparisonRows = comparison.scaleComparisons.filter((row) => row.blockId === blockId);
              const notableRows = comparisonRows
                .filter((row) => row.absoluteDifference !== null)
                .slice(0, 6);
              const responseRows = [...comparison.responseComparisons[blockId]]
                .filter((row) => row.absoluteDifference !== null)
                .sort((left, right) => (right.absoluteDifference ?? 0) - (left.absoluteDifference ?? 0));
              const featuredResponses = responseRows.slice(0, 6);

              return (
                <TabsContent key={blockId} value={blockId} className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="glass-panel relative overflow-hidden border-white/8 bg-white/[0.04]">
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at top, ${blockMeta.softTint}, transparent 42%)`,
                        }}
                      />
                      <CardHeader className="relative">
                        <CardTitle className="font-display text-3xl">{blockMeta.title}</CardTitle>
                        <CardDescription>{blockMeta.subtitle}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={chartData}>
                            <defs>
                              <linearGradient id={`left-fill-${chartToken}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(104,211,203,0.72)" />
                                <stop offset="100%" stopColor="rgba(104,211,203,0.08)" />
                              </linearGradient>
                              <linearGradient id={`right-fill-${chartToken}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="rgba(232,170,102,0.72)" />
                                <stop offset="100%" stopColor="rgba(232,170,102,0.08)" />
                              </linearGradient>
                            </defs>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis
                              dataKey="name"
                              tick={{ fill: "rgba(230,235,235,0.78)", fontSize: 11 }}
                            />
                            <Radar
                              name={comparison.leftProfile.profileMeta.displayName}
                              dataKey="left"
                              stroke="rgba(104,211,203,1)"
                              strokeWidth={2.2}
                              fill={`url(#left-fill-${chartToken})`}
                              fillOpacity={1}
                            />
                            <Radar
                              name={comparison.rightProfile.profileMeta.displayName}
                              dataKey="right"
                              stroke="rgba(232,170,102,1)"
                              strokeWidth={2.2}
                              fill={`url(#right-fill-${chartToken})`}
                              fillOpacity={1}
                            />
                            <Tooltip
                              content={({ active, payload, label }) =>
                                renderRadarTooltip(
                                  active,
                                  payload as
                                    | ReadonlyArray<{
                                        dataKey?: string | number;
                                        value?: number | string;
                                      }>
                                    | undefined,
                                  label,
                                  comparison.leftProfile.profileMeta.displayName,
                                  comparison.rightProfile.profileMeta.displayName,
                                )
                              }
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-white/8 bg-white/[0.04]">
                      <CardHeader>
                        <CardTitle className="font-display text-3xl">Сцена различий</CardTitle>
                        <CardDescription>
                          Вместо таблицы на первом экране только самые заметные сдвиги по шкалам.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        {notableRows.map((row) => (
                          <DifferenceMeter
                            key={`${blockId}-${row.scaleKey}`}
                            row={row}
                            leftName={comparison.leftProfile.profileMeta.displayName}
                            rightName={comparison.rightProfile.profileMeta.displayName}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="glass-panel border-white/8 bg-white/[0.04]">
                      <CardHeader>
                        <CardTitle className="font-display text-2xl">Резонанс по ответам</CardTitle>
                        <CardDescription>
                          Вопросы, где расхождение в ответах сильнее всего бросается в глаза.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        {featuredResponses.map((row) => (
                          <ResponseCard
                            key={`${blockId}-${row.itemId}`}
                            row={row}
                            leftName={comparison.leftProfile.profileMeta.displayName}
                            rightName={comparison.rightProfile.profileMeta.displayName}
                          />
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-white/8 bg-white/[0.04]">
                      <CardHeader>
                        <CardTitle className="font-display text-2xl">Как читать этот блок</CardTitle>
                        <CardDescription>
                          Сравнение полезно именно как материал для разговора, а не как итоговый балл.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                        <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                          {comparison.leftProfile.textualInterpretation.blockSummaries[blockId]}
                        </div>
                        <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                          {comparison.rightProfile.textualInterpretation.blockSummaries[blockId]}
                        </div>
                        <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                          Сильное расхождение не означает «несовместимость». Чаще это просто
                          место, где двум людям понадобится больше ясности, слов и согласования ожиданий.
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <details className="group rounded-[2rem] border border-white/8 bg-white/[0.03] p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div>
                        <p className="font-display text-2xl text-foreground">Все различия по шкалам</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          Полный список для ручного разбора без перегруза первого экрана.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>

                    <div className="mt-5 grid gap-3">
                      {comparisonRows.map((row) => (
                        <DifferenceMeter
                          key={`all-${blockId}-${row.scaleKey}`}
                          row={row}
                          leftName={comparison.leftProfile.profileMeta.displayName}
                          rightName={comparison.rightProfile.profileMeta.displayName}
                        />
                      ))}
                    </div>
                  </details>

                  <details className="group rounded-[2rem] border border-white/8 bg-white/[0.03] p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div>
                        <p className="font-display text-2xl text-foreground">Сырые ответы рядом</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          Полный слой сырых ответов, чтобы можно было вручную считывать нюансы.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>

                    <div className="mt-5 grid gap-3">
                      {comparison.responseComparisons[blockId].map((row) => (
                        <ResponseCard
                          key={`raw-${blockId}-${row.itemId}`}
                          row={row}
                          leftName={comparison.leftProfile.profileMeta.displayName}
                          rightName={comparison.rightProfile.profileMeta.displayName}
                        />
                      ))}
                    </div>
                  </details>
                </TabsContent>
              );
            })}
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
