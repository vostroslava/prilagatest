"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

import { requestProfileAnalysis } from "@/lib/ai/client";
import { getSavedProfileAnalysis, saveProfileAnalysis } from "@/lib/storage/analysis-store";
import {
  isProfileAnalysisOutdated,
  type SavedProfileAnalysis,
} from "@/types/analysis";
import type { FullProfileExport } from "@/types/profile";
import { formatDate } from "@/lib/presenters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalysisListSection } from "@/components/analysis/analysis-list-section";

interface ProfileAnalysisPanelProps {
  profile: FullProfileExport;
}

export function ProfileAnalysisPanel({
  profile,
}: ProfileAnalysisPanelProps) {
  const [analysis, setAnalysis] = React.useState<SavedProfileAnalysis | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const saved = await getSavedProfileAnalysis(profile.profileMeta.id);
      if (!cancelled) {
        setAnalysis(saved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile.profileMeta.id]);

  const outdated = isProfileAnalysisOutdated(analysis, profile);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);

      const response = await requestProfileAnalysis(profile);
      const nextAnalysis: SavedProfileAnalysis = {
        kind: "profile",
        profileId: profile.profileMeta.id,
        profileUpdatedAt: profile.profileMeta.updatedAt,
        meta: response.meta,
        content: response.analysis,
      };

      await saveProfileAnalysis(nextAnalysis);
      setAnalysis(nextAnalysis);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Не удалось получить AI-анализ профиля.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="dashboard-card-strong rounded-[2.35rem] p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-chip shadow-none">
              AI Analysis
            </Badge>
            {analysis ? (
              <Badge className="status-chip shadow-none">
                Сохранён {formatDate(analysis.meta.generatedAt)}
              </Badge>
            ) : null}
            {outdated ? (
              <Badge className="border border-orange-300/20 bg-orange-500/10 text-orange-200 shadow-none">
                Может быть устаревшим
              </Badge>
            ) : null}
          </div>
          <h2 className="text-gradient mt-4 font-display text-4xl tracking-tight">
            AI-интерпретация профиля
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Аккуратный слой интерпретации поверх уже существующих шкал и ответов.
            Он не ставит диагнозы и не заменяет ручное чтение профиля.
          </p>
        </div>

        <Button className="rounded-full px-5" onClick={() => void handleGenerate()} disabled={loading}>
          {loading ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {analysis ? "Обновить AI-анализ" : "Сгенерировать AI-анализ"}
        </Button>
      </div>

      {error ? (
        <div className="mt-5 rounded-[1.35rem] border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-6 space-y-6">
          <div className="dashboard-card rounded-[2rem] p-5">
            <p className="section-kicker text-primary/70">
              Summary
            </p>
            <div className="glow-divider mt-4" />
            <p className="mt-4 text-base leading-8 text-foreground/88">
              {analysis.content.summary}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalysisListSection title="Ключевые наблюдения" items={analysis.content.keyObservations} tone="accent" />
            <AnalysisListSection title="Зоны внимания" items={analysis.content.attentionAreas} tone="warning" />
            <AnalysisListSection title="Как человек проявляется в общении" items={analysis.content.interpersonalReading} />
            <AnalysisListSection title="Как читать конфликтный паттерн" items={analysis.content.conflictReading} />
            <AnalysisListSection title="Как читать профиль без ярлыков" items={analysis.content.howToReadWithoutLabels} />
            <div className="dashboard-card rounded-[1.8rem] p-5">
              <p className="section-kicker text-muted-foreground/76">
                Limits
              </p>
              <div className="glow-divider mt-4" />
              <div className="mt-4 quiet-panel rounded-[1.35rem] p-4 text-sm leading-7 text-muted-foreground">
                {analysis.content.disclaimer}
              </div>
              {outdated ? (
                <div className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-orange-300/20 bg-orange-500/10 p-4 text-sm leading-7 text-orange-100">
                  <AlertTriangle className="mt-1 size-4 shrink-0 text-orange-300" />
                  Профиль обновлялся после последней генерации. Анализ сохранён, но его лучше перечитать как архивный и при необходимости перегенерировать.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 quiet-panel rounded-[1.8rem] p-5 text-sm leading-7 text-muted-foreground">
          Здесь появится сохранённый AI-анализ профиля. После генерации он сохранится локально и останется доступен после reload страницы.
        </div>
      )}
    </section>
  );
}
