"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, PauseCircle, Sparkles } from "lucide-react";

import { useProfiles } from "@/components/providers/profiles-provider";
import { LikertScale } from "@/components/tests/likert-scale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TEST_BLOCKS } from "@/content/tests";
import { blockLabel, completionLabel, statusLabel } from "@/lib/presenters";
import { cn } from "@/lib/utils";
import type { BlockId, LikertValue } from "@/types/assessment";

interface TestRunnerProps {
  profileId: string;
}

interface QuestionLocation {
  blockId: BlockId;
  index: number;
}

function getBlockById(blockId: BlockId) {
  return TEST_BLOCKS.find((block) => block.id === blockId) ?? TEST_BLOCKS[0];
}

function getNextLocation(blockId: BlockId, index: number): QuestionLocation | null {
  const currentBlock = getBlockById(blockId);
  const currentBlockIndex = TEST_BLOCKS.findIndex((block) => block.id === blockId);

  if (index < currentBlock.questions.length - 1) {
    return {
      blockId,
      index: index + 1,
    };
  }

  const nextBlock = TEST_BLOCKS[currentBlockIndex + 1];

  if (!nextBlock) {
    return null;
  }

  return {
    blockId: nextBlock.id,
    index: 0,
  };
}

function getPreviousLocation(blockId: BlockId, index: number): QuestionLocation | null {
  const currentBlockIndex = TEST_BLOCKS.findIndex((block) => block.id === blockId);

  if (index > 0) {
    return {
      blockId,
      index: index - 1,
    };
  }

  const previousBlock = TEST_BLOCKS[currentBlockIndex - 1];

  if (!previousBlock) {
    return null;
  }

  return {
    blockId: previousBlock.id,
    index: previousBlock.questions.length - 1,
  };
}

function getAbsoluteQuestionIndex(blockId: BlockId, index: number) {
  let offset = 0;

  for (const block of TEST_BLOCKS) {
    if (block.id === blockId) {
      return offset + index;
    }

    offset += block.questions.length;
  }

  return index;
}

export function TestRunner({ profileId }: TestRunnerProps) {
  const router = useRouter();
  const { profiles, updateAnswer, setLastVisitedPage } = useProfiles();
  const [activeBlockId, setActiveBlockId] = React.useState<BlockId>("big-five");
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const initializedProfileRef = React.useRef<string | null>(null);
  const advanceTimeoutRef = React.useRef<number | null>(null);
  const profile = profiles.find((entry) => entry.profileMeta.id === profileId) ?? null;

  React.useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

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
  const currentBlock = getBlockById(activeBlockId);
  const currentProgress = profile.assessmentProgress[currentBlock.id];
  const currentResponses = profile.rawAnswers[currentBlock.id];
  const currentIndex = Math.min(
    Math.max(currentProgress.lastVisitedPage, 0),
    currentResponses.length - 1,
  );
  const currentResponse = currentResponses[currentIndex];
  const overallAnswered = Object.values(profile.assessmentProgress).reduce(
    (sum, entry) => sum + entry.answered,
    0,
  );
  const overallTotal = Object.values(profile.assessmentProgress).reduce(
    (sum, entry) => sum + entry.total,
    0,
  );
  const overallProgress = overallTotal ? (overallAnswered / overallTotal) * 100 : 0;

  if (!currentResponse) {
    return (
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>Не удалось открыть текущий вопрос</CardTitle>
          <CardDescription>
            Попробуйте вернуться к результату или заново открыть этот профиль.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-full">
            <Link href={`/profiles/${profile.profileMeta.id}/results`}>
              Открыть результат
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const absoluteQuestionIndex = getAbsoluteQuestionIndex(currentBlock.id, currentIndex);
  const nextLocation = getNextLocation(currentBlock.id, currentIndex);
  const previousLocation = getPreviousLocation(currentBlock.id, currentIndex);
  const upcomingBlock = nextLocation ? getBlockById(nextLocation.blockId) : null;
  const isCrossingToNextBlock =
    nextLocation !== null && nextLocation.blockId !== currentBlock.id;
  const remainingInBlock = Math.max(currentResponses.length - currentIndex - 1, 0);

  async function jumpToLocation(location: QuestionLocation) {
    setActiveBlockId(location.blockId);
    await setLastVisitedPage(currentProfileId, location.blockId, location.index);
  }

  async function handleAnswer(answer: LikertValue) {
    if (!currentResponse || isAdvancing) {
      return;
    }

    setIsAdvancing(true);
    await updateAnswer(currentProfileId, currentBlock.id, currentResponse.itemId, answer, currentIndex);

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
    }

    advanceTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        if (nextLocation) {
          await jumpToLocation(nextLocation);
        } else {
          router.push(`/profiles/${currentProfileId}/results`);
        }

        setIsAdvancing(false);
      })();
    }, 280);
  }

  async function handleBack() {
    if (!previousLocation || isAdvancing) {
      return;
    }

    setIsAdvancing(true);
    await jumpToLocation(previousLocation);
    setIsAdvancing(false);
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2.75rem] border border-white/5 bg-[#09090b]/90 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_15%_20%,rgba(60,160,152,0.16),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(182,140,82,0.16),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-white/12" />

      <div className="relative flex min-h-[76vh] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-9">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                Локальный режим
              </Badge>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {profile.profileMeta.displayName}
                </p>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Ответ сохраняется сразу после выбора. Можно остановиться в любой
                  момент и вернуться позже с того же шага.
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              className="rounded-full border border-white/8 bg-white/[0.03] px-4 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <Link href={`/profiles/${profile.profileMeta.id}/results`}>
                <PauseCircle className="size-4" />
                Сохранить и выйти
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.28em] text-muted-foreground/80">
              <span>{completionLabel(overallTotal ? overallAnswered / overallTotal : 0)}</span>
              <span>
                {overallAnswered} из {overallTotal}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(91,183,176,0.9),rgba(214,167,92,0.95))] transition-[width] duration-500 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {TEST_BLOCKS.map((block) => {
              const blockProgress = profile.assessmentProgress[block.id];
              const active = block.id === currentBlock.id;

              return (
                <div
                  key={block.id}
                  className={cn(
                    "rounded-[1.5rem] border px-4 py-3 transition-all",
                    active
                      ? "border-white/12 bg-white/[0.06] shadow-[0_24px_60px_rgba(0,0,0,0.24)]"
                      : "border-white/6 bg-white/[0.025]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/70">
                        Блок {block.order}
                      </p>
                      <p className="text-sm font-medium text-foreground">{block.title}</p>
                    </div>
                    {blockProgress.status === "completed" ? (
                      <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                    ) : (
                      <span className="mt-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
                        {statusLabel(blockProgress.status)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-px overflow-hidden rounded-full bg-white/8">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500",
                        active ? "bg-primary/90" : "bg-white/25",
                      )}
                      style={{ width: `${blockProgress.completionRatio * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 items-center py-10 sm:py-14">
          <div
            key={`${currentBlock.id}-${currentResponse.itemId}`}
            className="mx-auto w-full max-w-5xl animate-in fade-in-0 slide-in-from-bottom-8 duration-500"
          >
            <div className="space-y-10 text-center">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                    {blockLabel(currentBlock.id)}
                  </Badge>
                  <Badge className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                    Вопрос {absoluteQuestionIndex + 1} из {overallTotal}
                  </Badge>
                </div>

                <div className="space-y-5">
                  <p className="text-xs uppercase tracking-[0.38em] text-muted-foreground/60">
                    {currentResponse.itemId}
                  </p>
                  <h1 className="font-display text-4xl leading-[1.14] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    {currentResponse.russianText}
                  </h1>
                  <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
                    {currentBlock.disclosure}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                    Шкала {currentResponse.scaleKey}
                  </Badge>
                  <Badge className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                    Источник {currentResponse.source.instrumentId}
                  </Badge>
                  {currentResponse.reverseKeyed ? (
                    <Badge className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground shadow-none">
                      Обратное кодирование
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="mx-auto max-w-4xl">
                <LikertScale
                  value={currentResponse.answer}
                  disabled={isAdvancing}
                  onChange={(answer) => void handleAnswer(answer)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-5 border-t border-white/8 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/12 bg-emerald-400/8 px-3 py-1 text-xs text-emerald-200/80">
              <Sparkles className="size-3.5" />
              {isCrossingToNextBlock
                ? `Следом откроется ${upcomingBlock?.title.toLowerCase()}`
                : remainingInBlock > 0
                  ? `В этом блоке осталось ${remainingInBlock} ${
                      remainingInBlock === 1 ? "тезис" : "тезиса"
                    }`
                  : "Последний шаг перед итогом"}
            </div>
            <p className="text-sm font-medium text-foreground">{currentBlock.title}</p>
            <p className="text-sm leading-7 text-muted-foreground">
              {currentProgress.answered}/{currentProgress.total} ответов внутри блока.
              Автоматический анализ совместимости в этой версии не выполняется.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full border border-white/8 bg-white/[0.03] px-4 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              disabled={!previousLocation || isAdvancing}
              onClick={() => void handleBack()}
            >
              <ArrowLeft className="size-4" />
              На шаг назад
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
