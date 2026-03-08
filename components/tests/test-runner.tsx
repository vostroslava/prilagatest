"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles, X } from "lucide-react";

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
  const [transitionState, setTransitionState] = React.useState<
    "idle" | "exit-forward" | "exit-backward" | "enter-forward" | "enter-backward"
  >("idle");
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
  const questionPositionInBlock = currentIndex + 1;
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

  async function runQuestionTransition(
    location: QuestionLocation | null,
    direction: "forward" | "backward",
  ) {
    if (!location) {
      return;
    }

    setIsAdvancing(true);
    setTransitionState(direction === "forward" ? "exit-forward" : "exit-backward");
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    await jumpToLocation(location);
    setTransitionState(direction === "forward" ? "enter-forward" : "enter-backward");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setTransitionState("idle");
      });
    });

    window.setTimeout(() => {
      setIsAdvancing(false);
    }, 220);
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
          await runQuestionTransition(nextLocation, "forward");
        } else {
          setTransitionState("exit-forward");
          await new Promise((resolve) => window.setTimeout(resolve, 180));
          router.push(`/profiles/${currentProfileId}/results`);
          setIsAdvancing(false);
        }
      })();
    }, 200);
  }

  async function handleBack() {
    if (!previousLocation) {
      return;
    }

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    await runQuestionTransition(previousLocation, "backward");
  }

  const questionMotionClass = cn(
    "transition-[transform,opacity,filter] duration-200 ease-out will-change-transform",
    transitionState === "exit-forward" && "-translate-x-8 opacity-0",
    transitionState === "exit-backward" && "translate-x-8 opacity-0",
    transitionState === "enter-forward" && "translate-x-8 opacity-0",
    transitionState === "enter-backward" && "-translate-x-8 opacity-0",
    transitionState === "idle" && "translate-x-0 opacity-100",
  );

  return (
    <div className="relative grid min-h-[100dvh] bg-background xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="fixed left-0 right-0 top-0 z-50 h-1" style={{ background: "var(--progress-track)" }}>
        <div
          className="h-full transition-all duration-700 ease-out shadow-[0_0_16px_var(--surface-glow)]"
          style={{ background: "var(--progress-fill)", width: `${overallProgress}%` }}
          aria-label={completionLabel(overallTotal ? overallAnswered / overallTotal : 0)}
        />
      </div>

      <aside className="hidden border-r border-[color:var(--surface-border)] bg-[var(--surface-panel-strong)] xl:flex xl:flex-col">
        <div className="flex h-full flex-col px-6 py-8">
          <div className="space-y-4">
            <Badge className="w-fit rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
              Test Flow
            </Badge>
            <div>
              <p className="font-display text-3xl tracking-tight text-foreground">
                {profile.profileMeta.displayName}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {completionLabel(overallTotal ? overallAnswered / overallTotal : 0)} · {overallAnswered} из {overallTotal}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {TEST_BLOCKS.map((block) => {
              const progress = profile.assessmentProgress[block.id];
              const active = block.id === currentBlock.id;

              return (
                <div
                  key={block.id}
                  className={cn(
                    "rounded-[1.6rem] p-4 transition-all",
                    active ? "panel-inset-strong" : "panel-inset",
                    active && "shadow-[0_18px_44px_var(--surface-glow)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        Блок {block.order}
                      </p>
                      <p className="mt-2 text-base font-semibold tracking-tight text-foreground">
                        {block.title}
                      </p>
                    </div>
                    {progress.status === "completed" ? (
                      <CheckCircle2 className="mt-1 size-4 text-primary" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{statusLabel(progress.status)}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--progress-track)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: progress.status === "not-started" ? "var(--progress-fill-muted)" : "var(--progress-fill)",
                        width: `${progress.completionRatio * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="panel-inset mt-auto rounded-[1.6rem] p-4">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              {isCrossingToNextBlock
                ? `Дальше откроется ${upcomingBlock?.title.toLowerCase()}`
                : remainingInBlock > 0
                  ? `В этом блоке осталось ${remainingInBlock}`
                  : "Последний вопрос перед итогом"}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Ответы сохраняются сразу. Вы в любой момент можете выйти и вернуться позже.
            </p>
          </div>
        </div>
      </aside>

      <div className="relative flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-6 lg:px-12">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {blockLabel(currentBlock.id)}
            </p>
            <p className="mt-1 text-sm text-foreground/82">
              Вопрос {absoluteQuestionIndex + 1} из {overallTotal}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="size-11 rounded-full px-0"
            aria-label="Прервать тест"
          >
            <Link href={`/profiles/${profile.profileMeta.id}/results`}>
              <X className="size-4" />
            </Link>
          </Button>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div
            className="panel-strong w-full max-w-5xl rounded-[2.6rem] p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:p-8"
          >
            <div className={cn("mx-auto flex max-w-4xl flex-col items-center text-center", questionMotionClass)}>
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-muted-foreground shadow-none">
                {blockLabel(currentBlock.id)} · {questionPositionInBlock}/{currentProgress.total}
              </Badge>

              <h1 className="mt-8 font-display text-5xl leading-[1.02] tracking-tight text-foreground balance-text sm:text-6xl lg:text-[4.8rem]">
                {currentResponse.russianText}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                Выберите степень согласия, и следующий вопрос откроется автоматически.
              </p>

              <div className="mt-10 w-full">
                <LikertScale
                  value={currentResponse.answer}
                  disabled={isAdvancing}
                  onChange={(answer) => void handleAnswer(answer)}
                />
              </div>

              <div className="mt-8 flex w-full flex-col gap-4 border-t border-[color:var(--surface-divider)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  className="rounded-full px-5"
                  disabled={!previousLocation}
                  onClick={() => void handleBack()}
                >
                  <ArrowLeft className="size-4" />
                  Назад
                </Button>

                <p className="text-sm text-muted-foreground">
                  {currentProgress.answered}/{currentProgress.total} ответов в этом блоке
                </p>
              </div>

              <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
                {currentResponse.itemId} · {currentResponse.scaleKey}
                {currentResponse.reverseKeyed ? " · reverse" : ""}
                {" · "}
                {currentResponse.source.instrumentId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
