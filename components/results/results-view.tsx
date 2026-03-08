"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBar } from "@/components/visuals/metric-bar";
import { ProfileRadar } from "@/components/visuals/profile-radar";
import { contextLabel, formatDate, syncStatusLabel } from "@/lib/presenters";
import { toProfileExport } from "@/lib/storage/profile-document";

interface ResultsViewProps {
  profileId: string;
}

export function ResultsView({ profileId }: ResultsViewProps) {
  const { profiles } = useProfiles();
  const profile = profiles.find((entry) => entry.profileMeta.id === profileId) ?? null;

  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = React.useState<string | null>(null);

  async function handleAnalyze() {
    if (!profile) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: toProfileExport(profile) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при запросе к AI");
      }

      setAiAnalysis(data.analysis);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!profile) {
    return (
      <Card className="glass-panel border-[color:var(--surface-border)]">
        <CardHeader>
          <CardTitle>Профиль не найден</CardTitle>
          <CardDescription>
            Откройте локальный профиль заново или создайте новый.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-full">
            <Link href="/profiles/new">Создать профиль</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const bigFiveData = profile.scoring["big-five"].map((scale) => ({
    label: scale.shortLabel,
    value: scale.normalized ?? 0,
  }));
  const ipcData = profile.scoring["ipip-ipc"].map((scale) => ({
    label: scale.shortLabel,
    value: scale.normalized ?? 0,
  }));
  const strongestTraits = [...profile.scoring["big-five"]]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (right.normalized ?? 0) - (left.normalized ?? 0))
    .slice(0, 3);
  const quieterTraits = [...profile.scoring["big-five"]]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (left.normalized ?? 0) - (right.normalized ?? 0))
    .slice(0, 3);
  const ipcDerived = profile.derivedScores.filter((score) => score.blockId === "ipip-ipc");

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr_0.86fr]">
        <div className="glass-panel flex flex-col justify-between rounded-[2.3rem] p-6 sm:p-7">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                {profile.profileMeta.status === "ready" ? "Профиль готов" : "Черновик"}
              </Badge>
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                Обновлён {formatDate(profile.profileMeta.updatedAt)}
              </Badge>
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                {syncStatusLabel(profile.syncMeta?.status)}
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
                My Profile
              </p>
              <h1 className="font-display text-5xl leading-[0.98] tracking-tight text-foreground">
                {profile.profileMeta.displayName}
              </h1>
              <p className="text-base leading-8 text-foreground/86">
                {profile.textualInterpretation.shortProfile}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {profile.textualInterpretation.detailedProfile}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-5">
              <Link href={`/profiles/${profile.profileMeta.id}/tests`}>Продолжить тесты</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href={`/profiles/${profile.profileMeta.id}/raw-data`}>Экспорт</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-5 border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              AI Анализ
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-[2.4rem] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                  Big Five
                </p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Главная карта профиля: пять широких факторов, собранных в один
                  графический рисунок.
                </p>
              </div>

              <div className="space-y-4">
                {profile.scoring["big-five"].map((scale) => (
                  <MetricBar
                    key={scale.key}
                    label={scale.label}
                    value={scale.normalized ?? 0}
                  />
                ))}
              </div>
            </div>

            <ProfileRadar
              data={bigFiveData}
              height={440}
              centerLabel="Profile Core"
              centerValue={profile.profileMeta.displayName}
              primaryLabel={profile.profileMeta.displayName}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
              Strengths
            </p>
            <div className="mt-4 space-y-4">
              {strongestTraits.map((trait) => (
                <div key={trait.key} className="panel-inset rounded-[1.4rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold tracking-tight text-foreground">{trait.label}</p>
                    <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 shadow-none">
                      {trait.normalized}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {profile.textualInterpretation.scaleNarratives[trait.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
              Zones of tension
            </p>
            <div className="mt-4 space-y-4">
              {quieterTraits.map((trait) => (
                <div key={trait.key} className="panel-inset rounded-[1.4rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold tracking-tight text-foreground">{trait.label}</p>
                    <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 shadow-none">
                      {trait.normalized}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {profile.textualInterpretation.scaleNarratives[trait.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[2.3rem] p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                Interpersonal Style
              </p>
              <h2 className="font-display text-3xl tracking-tight text-foreground">
                Как вы занимаете пространство рядом с другим человеком
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {profile.textualInterpretation.blockSummaries["ipip-ipc"]}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {ipcDerived.map((score) => (
                  <div
                    key={score.key}
                    className="panel-inset rounded-[1.4rem] p-4"
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                      {score.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                      {score.normalized ?? "—"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {score.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <ProfileRadar
              data={ipcData}
              height={360}
              centerLabel="IPC"
              centerValue="Style"
              primaryLabel="IPIP-IPC"
            />
          </div>
        </div>

        <div className="glass-panel rounded-[2.3rem] p-6">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                Conflict Profile
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground">
                Напряжение, защита и восстановление
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {profile.textualInterpretation.blockSummaries["conflict-profile"]}
              </p>
            </div>

            <div className="space-y-4">
              {profile.scoring["conflict-profile"].map((scale) => (
                <MetricBar
                  key={scale.key}
                  label={scale.label}
                  value={scale.normalized ?? 0}
                  muted
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {(aiAnalysis || analyzeError) && (
          <div className="glass-panel lg:col-span-3 rounded-[2rem] p-5 sm:p-7 border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70">
                  Claude AI Insight
                </p>
                <h2 className="font-display text-2xl tracking-tight text-foreground">
                  Глубокий анализ профиля
                </h2>
              </div>
            </div>

            {analyzeError ? (
              <div className="panel-inset rounded-[1.4rem] p-4 text-destructive border-destructive/20">
                <p className="text-sm font-medium">Ошибка загрузки анализа:</p>
                <p className="mt-1 text-sm opacity-90">{analyzeError}</p>
                <p className="mt-4 text-xs opacity-70">
                  Убедитесь, что вы добавили GEMINI_API_KEY в .env.local и перезапустили локальный сервер.
                </p>
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-muted-foreground prose-headings:font-display prose-headings:text-foreground prose-p:leading-8 prose-li:leading-7">
                <div dangerouslySetInnerHTML={{ __html: aiAnalysis?.replace(/\n/g, "<br />") ?? "" }} />
              </div>
            )}
          </div>
        )}

        <div className="glass-panel rounded-[2rem] p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Context
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.profileMeta.contexts.map((context) => (
              <Badge
                key={context}
                className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground shadow-none"
              >
                {contextLabel(context)}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {profile.profileMeta.about || "Дополнительная заметка пока не заполнена."}
          </p>
        </div>

        <div className="glass-panel rounded-[2rem] p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Interpretation
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {profile.textualInterpretation.blockSummaries["big-five"]}
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {profile.textualInterpretation.blockSummaries["ipip-ipc"]}
          </p>
        </div>

        <div className="glass-panel rounded-[2rem] p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
            Limits
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
            {profile.textualInterpretation.disclaimers.map((note) => (
              <div key={note} className="panel-inset rounded-[1.4rem] p-4">
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
