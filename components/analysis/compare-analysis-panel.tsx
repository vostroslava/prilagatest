"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

import { requestCompareAnalysis } from "@/lib/ai/client";
import { AnalysisListSection } from "@/components/analysis/analysis-list-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/presenters";
import {
  getSavedCompareAnalysis,
  saveCompareAnalysis,
} from "@/lib/storage/analysis-store";
import {
  createCompareAnalysisKey,
  isCompareAnalysisOutdated,
  type SavedCompareAnalysis,
} from "@/types/analysis";
import type { FullProfileExport } from "@/types/profile";

interface CompareAnalysisPanelProps {
  leftProfile: FullProfileExport;
  rightProfile: FullProfileExport;
}

export function CompareAnalysisPanel({
  leftProfile,
  rightProfile,
}: CompareAnalysisPanelProps) {
  const pairKey = React.useMemo(
    () =>
      createCompareAnalysisKey(
        leftProfile.profileMeta.id,
        rightProfile.profileMeta.id,
      ),
    [leftProfile.profileMeta.id, rightProfile.profileMeta.id],
  );
  const [analysis, setAnalysis] = React.useState<SavedCompareAnalysis | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const saved = await getSavedCompareAnalysis(pairKey);
      if (!cancelled) {
        setAnalysis(saved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pairKey]);

  const outdated = isCompareAnalysisOutdated(analysis, leftProfile, rightProfile);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);

      const response = await requestCompareAnalysis(leftProfile, rightProfile);
      const nextAnalysis: SavedCompareAnalysis = {
        kind: "compare",
        pairKey,
        leftProfileId: leftProfile.profileMeta.id,
        rightProfileId: rightProfile.profileMeta.id,
        leftProfileUpdatedAt: leftProfile.profileMeta.updatedAt,
        rightProfileUpdatedAt: rightProfile.profileMeta.updatedAt,
        meta: response.meta,
        content: response.analysis,
      };

      await saveCompareAnalysis(nextAnalysis);
      setAnalysis(nextAnalysis);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Не удалось получить AI-анализ сравнения.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="dashboard-card rounded-[2.45rem] p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-chip shadow-none">
              AI Compare
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
            AI-анализ сравнения
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Этот слой помогает прочитать сходства и различия без фейкового compatibility score.
            Анализ остаётся материалом для разговора, а не вердиктом.
          </p>
        </div>

        <Button className="rounded-full px-5" onClick={() => void handleGenerate()} disabled={loading}>
          {loading ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {analysis ? "Обновить compare-анализ" : "Сгенерировать AI-анализ сравнения"}
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
            <AnalysisListSection title="Сходства" items={analysis.content.similarities} tone="accent" />
            <AnalysisListSection title="Различия" items={analysis.content.differences} tone="warning" />
            <AnalysisListSection title="Потенциальные сильные стороны взаимодействия" items={analysis.content.interactionStrengths} />
            <AnalysisListSection title="Возможные friction points" items={analysis.content.frictionPoints} tone="warning" />
            <AnalysisListSection title="Подсказки для коммуникации" items={analysis.content.communicationNotes} />
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
                  Один из профилей обновлялся после последней генерации. Сохранённый compare-анализ оставлен как архивный и может требовать обновления.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 quiet-panel rounded-[1.8rem] p-5 text-sm leading-7 text-muted-foreground">
          Здесь появится сохранённый AI-анализ пары. После генерации он сохранится локально и останется доступен после reload.
        </div>
      )}
    </section>
  );
}
