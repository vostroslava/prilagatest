"use client";

import * as React from "react";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { BlockId } from "@/types/assessment";
import type { ComparisonResponseDifference, ComparisonScaleDifference } from "@/types/export";
import type { FullProfileExport } from "@/types/profile";
import { MetricBar } from "@/components/visuals/metric-bar";
import { ProfileRadar } from "@/components/visuals/profile-radar";

const BLOCK_META: Record<BlockId, { title: string; subtitle: string }> = {
  "big-five": {
    title: "Big Five",
    subtitle: "Базовый рисунок личности и общий личностный контур.",
  },
  "ipip-ipc": {
    title: "Interpersonal Style",
    subtitle: "Как два человека занимают пространство рядом друг с другом.",
  },
  "conflict-profile": {
    title: "Conflict Profile",
    subtitle: "Как проявляются напряжение, защита и восстановление после трения.",
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
      label: score.shortLabel,
      value: score.normalized ?? 0,
      secondaryValue: rightScore?.normalized ?? 0,
    };
  });
}

function ScaleCard({
  title,
  rows,
  leftName,
  rightName,
}: {
  title: string;
  rows: ComparisonScaleDifference[];
  leftName: string;
  rightName: string;
}) {
  return (
    <div className="glass-panel rounded-[1.9rem] p-5">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
        {title}
      </p>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={`${row.blockId}-${row.scaleKey}`} className="panel-inset rounded-[1.45rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold tracking-tight text-foreground">{row.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground/70">
                  {row.direction === "equal"
                    ? "Очень близко"
                    : row.direction === "left-higher"
                      ? `${leftName} выше`
                      : row.direction === "right-higher"
                        ? `${rightName} выше`
                        : "Недостаточно данных"}
                </p>
              </div>
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 shadow-none">
                {row.absoluteDifference ?? "—"}
              </Badge>
            </div>
            <div className="mt-4 grid gap-3">
              <MetricBar label={leftName} value={row.leftValue ?? 0} muted />
              <MetricBar label={rightName} value={row.rightValue ?? 0} />
            </div>
          </div>
        ))}
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
  return (
    <div className="panel-inset rounded-[1.4rem] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground/65">
            {row.itemId} · {row.scaleKey}
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground/90">{row.question}</p>
        </div>
        <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 shadow-none">
          {row.absoluteDifference ?? "—"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="panel-inset rounded-[1.15rem] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
            {leftName}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {row.leftAnswer ?? "—"}
          </p>
        </div>
        <div className="panel-inset rounded-[1.15rem] px-3 py-3">
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
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel rounded-[2.35rem] p-6 sm:p-7">
          <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
            Comparison
          </Badge>
          <h1 className="mt-5 font-display text-5xl leading-[0.98] tracking-tight text-foreground">
            Сравнение двух полных профилей
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Этот экран не считает “совместимость”. Он собирает два полных профиля,
            накладывает их графические контуры и показывает материал для ручного разбора:
            сильные совпадения, различия, напряжённые зоны и вопросы для разговора.
          </p>
        </div>

        <div className="glass-panel rounded-[2.35rem] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["left", leftProfile, "Левый профиль"],
              ["right", rightProfile, "Правый профиль"],
            ] as const).map(([side, profile, title]) => (
              <div key={side} className="panel-inset rounded-[1.7rem] p-5">
                <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground/70">
                  {title}
                </p>
                <div className="mt-4 space-y-3">
                  <Select onValueChange={(value) => loadFromLocal(side, String(value))}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Выбрать локальный профиль" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profileOption) => (
                        <SelectItem key={profileOption.profileMeta.id} value={profileOption.profileMeta.id}>
                          {profileOption.profileMeta.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="control-surface flex cursor-pointer items-center justify-center rounded-full border-dashed px-4 py-4 text-sm text-muted-foreground hover:text-foreground">
                    Загрузить JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(event) => void loadFromFile(side, event)}
                    />
                  </label>
                </div>

                {profile ? (
                  <div className="panel-inset rounded-[1.4rem] p-4">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {profile.profileMeta.displayName}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {profile.textualInterpretation.shortProfile}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {error ? (
            <div className="mt-4 rounded-[1.4rem] border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      {comparison ? (
        <>
          <section className="glass-panel rounded-[2.5rem] p-6 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                  Overlay Analysis
                </p>
                <h2 className="mt-3 font-display text-4xl tracking-tight text-foreground">
                  {comparison.leftProfile.profileMeta.displayName} vs {comparison.rightProfile.profileMeta.displayName}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                  {comparison.summary.overview}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-full px-5"
                  onClick={() =>
                    downloadBlob(
                      `${filenameBase}-comparison-package.json`,
                      JSON.stringify(comparison, null, 2),
                      "application/json",
                    )
                  }
                >
                  comparison-package.json
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full px-5"
                  onClick={() =>
                    downloadBlob(
                      `${filenameBase}-comparison-package.md`,
                      generateComparisonMarkdown(comparison),
                      "text/markdown;charset=utf-8",
                    )
                  }
                >
                  comparison-package.md
                </Button>
              </div>
            </div>

            <Tabs defaultValue="big-five" className="mt-8 space-y-6">
              <TabsList className="w-full flex-wrap rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-2">
                {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => (
                  <TabsTrigger key={blockId} value={blockId} className="rounded-full px-5">
                    {BLOCK_META[blockId].title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => {
                const chartData = getBlockChartData(blockId, comparison.leftProfile, comparison.rightProfile);
                const comparisonRows = comparison.scaleComparisons.filter((row) => row.blockId === blockId);
                const closest = comparisonRows
                  .filter((row) => row.absoluteDifference !== null)
                  .sort((a, b) => (a.absoluteDifference ?? 99) - (b.absoluteDifference ?? 99))
                  .slice(0, 3);
                const furthest = comparisonRows
                  .filter((row) => row.absoluteDifference !== null)
                  .sort((a, b) => (b.absoluteDifference ?? 0) - (a.absoluteDifference ?? 0))
                  .slice(0, 3);
                const responseRows = [...comparison.responseComparisons[blockId]]
                  .filter((row) => row.absoluteDifference !== null)
                  .sort((a, b) => (b.absoluteDifference ?? 0) - (a.absoluteDifference ?? 0));
                const prompts = furthest.slice(0, 3).map((row) => ({
                  key: row.scaleKey,
                  text: `Полезно заранее обсудить, как каждый понимает ${row.label.toLowerCase()} и какие сигналы здесь важны.`,
                }));

                return (
                  <TabsContent key={blockId} value={blockId} className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.16fr_0.82fr]">
                      {[comparison.leftProfile, comparison.rightProfile].map((profile, index) => (
                        <div key={profile.profileMeta.id} className="glass-panel rounded-[2rem] p-5">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                            {index === 0 ? "Left profile" : "Right profile"}
                          </p>
                          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                            {profile.profileMeta.displayName}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {profile.profileMeta.contexts.map((context) => (
                              <Badge
                                key={`${profile.profileMeta.id}-${context}`}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground shadow-none"
                              >
                                {contextLabel(context)}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            {profile.textualInterpretation.blockSummaries[blockId]}
                          </p>
                        </div>
                      ))}

                      <ProfileRadar
                        data={chartData}
                        height={420}
                        centerLabel={BLOCK_META[blockId].title}
                        centerValue="Overlay"
                        primaryLabel={comparison.leftProfile.profileMeta.displayName}
                        secondaryLabel={comparison.rightProfile.profileMeta.displayName}
                      />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-4">
                      <ScaleCard
                        title="Сильные совпадения"
                        rows={closest}
                        leftName={comparison.leftProfile.profileMeta.displayName}
                        rightName={comparison.rightProfile.profileMeta.displayName}
                      />
                      <ScaleCard
                        title="Ключевые различия"
                        rows={furthest}
                        leftName={comparison.leftProfile.profileMeta.displayName}
                        rightName={comparison.rightProfile.profileMeta.displayName}
                      />

                      <div className="glass-panel rounded-[1.9rem] p-5">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                          Potential friction points
                        </p>
                        <div className="mt-4 space-y-4">
                          {responseRows.slice(0, 3).map((row) => (
                            <div key={row.itemId} className="panel-inset rounded-[1.4rem] p-4">
                              <p className="text-sm font-medium tracking-tight text-foreground">
                                {row.scaleKey}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                {row.question}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-panel rounded-[1.9rem] p-5">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                          Communication prompts
                        </p>
                        <div className="mt-4 space-y-4">
                          {prompts.map((prompt) => (
                            <div key={prompt.key} className="panel-inset rounded-[1.4rem] p-4 text-sm leading-7 text-muted-foreground">
                              {prompt.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <details className="glass-panel rounded-[2rem] p-5 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div>
                          <p className="font-display text-2xl tracking-tight text-foreground">Сырые ответы рядом</p>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            Полный слой ответов для ручного анализа внутри этого блока.
                          </p>
                        </div>
                        <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 shadow-none">
                          {comparison.responseComparisons[blockId].length}
                        </Badge>
                      </summary>
                      <div className="mt-5 grid gap-3">
                        {comparison.responseComparisons[blockId].map((row) => (
                          <ResponseCard
                            key={`${blockId}-${row.itemId}`}
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
          </section>
        </>
      ) : null}
    </div>
  );
}
