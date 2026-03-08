"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TEST_BLOCKS } from "@/content/tests";
import { blockLabel, completionLabel, statusLabel } from "@/lib/presenters";
import { cn } from "@/lib/utils";
import type { BlockId, LikertValue } from "@/types/assessment";
import { LikertScale } from "@/components/tests/likert-scale";

const QUESTIONS_PER_PAGE = 5;

interface TestRunnerProps {
  profileId: string;
}

export function TestRunner({ profileId }: TestRunnerProps) {
  const { profiles, updateAnswer, setLastVisitedPage } = useProfiles();
  const [activeBlockId, setActiveBlockId] = React.useState<BlockId>("big-five");
  const [isPending, startTransition] = React.useTransition();
  const initializedProfileRef = React.useRef<string | null>(null);
  const profile = profiles.find((entry) => entry.profileMeta.id === profileId) ?? null;

  React.useEffect(() => {
    if (!profile) {
      return;
    }

    if (initializedProfileRef.current === profile.profileMeta.id) {
      return;
    }

    const suggested =
      TEST_BLOCKS.find(
        (block) => profile.assessmentProgress[block.id].status !== "completed",
      )?.id ?? "big-five";

    initializedProfileRef.current = profile.profileMeta.id;
    setActiveBlockId(suggested);
  }, [profile]);

  if (!profile) {
    return (
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>Профиль не найден</CardTitle>
          <CardDescription>
            Возможно, он ещё не создан в локальном хранилище или был импортирован под
            другим ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-full">
            <Link href="/profiles/new">Создать новый профиль</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentProfileId = profile.profileMeta.id;
  const currentBlock = TEST_BLOCKS.find((block) => block.id === activeBlockId) ?? TEST_BLOCKS[0];
  const currentResponses = profile.rawAnswers[currentBlock.id];
  const currentProgress = profile.assessmentProgress[currentBlock.id];
  const totalPages = Math.ceil(currentResponses.length / QUESTIONS_PER_PAGE);
  const pageIndex = Math.min(currentProgress.lastVisitedPage, totalPages - 1);
  const pageResponses = currentResponses.slice(
    pageIndex * QUESTIONS_PER_PAGE,
    (pageIndex + 1) * QUESTIONS_PER_PAGE,
  );
  const overallAnswered = Object.values(profile.assessmentProgress).reduce(
    (sum, entry) => sum + entry.answered,
    0,
  );
  const overallTotal = Object.values(profile.assessmentProgress).reduce(
    (sum, entry) => sum + entry.total,
    0,
  );

  function handleAnswer(itemId: string, answer: LikertValue) {
    startTransition(() => {
      void updateAnswer(currentProfileId, currentBlock.id, itemId, answer, pageIndex);
    });
  }

  function goToPage(nextPage: number) {
    startTransition(() => {
      void setLastVisitedPage(currentProfileId, currentBlock.id, nextPage);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle className="font-display text-3xl">
              {profile.profileMeta.displayName}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Все ответы сохраняются локально после каждого клика. Можно остановиться и
              продолжить позже с того же места.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Общий прогресс</span>
                <span>{completionLabel(overallAnswered / overallTotal)}</span>
              </div>
              <Progress value={(overallAnswered / overallTotal) * 100} className="h-2" />
            </div>

            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/8 p-4 text-sm leading-7 text-muted-foreground">
              Первая версия не выдаёт автоматический вывод о совместимости. Она только
              собирает полный профиль, который потом можно экспортировать и сравнить
              вручную.
            </div>

            <Button asChild className="w-full rounded-full">
              <Link href={`/profiles/${profile.profileMeta.id}/results`}>
                Открыть текущий результат
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {TEST_BLOCKS.map((block) => {
            const progress = profile.assessmentProgress[block.id];
            const active = block.id === currentBlock.id;

            return (
              <button
                key={block.id}
                type="button"
                className={cn(
                  "glass-panel w-full rounded-[1.75rem] border px-4 py-4 text-left transition-colors",
                  active ? "border-primary/45 bg-primary/8" : "border-white/10 hover:border-primary/20",
                )}
                onClick={() => setActiveBlockId(block.id)}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{block.title}</p>
                    <p className="text-sm text-muted-foreground">{block.subtitle}</p>
                  </div>
                  {progress.status === "completed" ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : null}
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    {statusLabel(progress.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {progress.answered} / {progress.total}
                  </span>
                </div>
                <Progress value={progress.completionRatio * 100} className="h-2" />
              </button>
            );
          })}
        </div>
      </div>

      <Card className="glass-panel border-white/10">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Блок {currentBlock.order}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Страница {pageIndex + 1} / {totalPages}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {currentProgress.answered}/{currentProgress.total} ответов
            </Badge>
          </div>
          <div>
            <CardTitle className="font-display text-3xl">{currentBlock.title}</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-base leading-7">
              {currentBlock.description}
            </CardDescription>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-background/50 p-4 text-sm leading-7 text-muted-foreground">
            {currentBlock.disclosure}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {pageResponses.map((response) => (
            <div key={response.itemId} className="space-y-4 rounded-[1.75rem] border border-white/10 bg-background/40 p-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="rounded-full">
                    {response.itemId}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {response.scaleKey}
                  </Badge>
                  {response.reverseKeyed ? (
                    <Badge variant="outline" className="rounded-full">
                      обратное кодирование
                    </Badge>
                  ) : null}
                </div>
                <p className="text-lg leading-8 text-foreground">{response.russianText}</p>
              </div>
              <LikertScale
                value={response.answer}
                onChange={(answer) => handleAnswer(response.itemId, answer)}
              />
            </div>
          ))}

          <Separator />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{blockLabel(currentBlock.id)}</p>
              <p className="text-sm text-muted-foreground">
                {currentProgress.status === "completed"
                  ? "Блок заполнен полностью."
                  : "Можно заполнять в любом порядке, прогресс сохраняется локально."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={pageIndex === 0 || isPending}
                onClick={() => goToPage(pageIndex - 1)}
              >
                <ArrowLeft className="size-4" />
                Назад
              </Button>
              <Button
                className="rounded-full"
                disabled={pageIndex >= totalPages - 1 || isPending}
                onClick={() => goToPage(pageIndex + 1)}
              >
                Дальше
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
