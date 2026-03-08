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
      <Card className="glass-panel border-[color:var(--surface-border)]">
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
      <Card className="glass-panel border-[color:var(--surface-border)]">
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
    <div className="relative min-h-[100dvh] bg-transparent px-3 py-3 sm:px-4 sm:py-4">
      <div className="dashboard-frame relative flex min-h-[calc(100dvh-1.5rem)] flex-col rounded-[2.4rem] sm:min-h-[calc(100dvh-2rem)]">
        <div className="absolute inset-x-0 top-0 z-20 h-[2px] bg-[linear-gradient(90deg,transparent,var(--progress-fill),transparent)] shadow-[0_0_12px_rgba(45,211,191,0.35)]" />

        <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="shell-control shell-control-icon glow-pill rounded-2xl text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="font-display text-2xl tracking-tight text-foreground">Тесты</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {profile.profileMeta.displayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-10 rounded-full px-4 sm:inline-flex"
              asChild
            >
              <Link href={`/profiles/${profile.profileMeta.id}/results`}>
                Приостановить
              </Link>
            </Button>
            <Button
              variant="outline"
              className="size-10 rounded-full px-0"
              aria-label="Прервать тест"
              asChild
            >
              <Link href={`/profiles/${profile.profileMeta.id}/results`}>
                <X className="size-4" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[2.1rem] border-t border-[color:var(--surface-border)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,241,213,0.12),transparent_34%),radial-gradient(circle_at_50%_18%,rgba(91,241,213,0.08),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[52%] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(91,241,213,0.16),transparent_48%)] blur-2xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between px-4 pb-6 pt-6 sm:px-6 lg:px-10 lg:pt-10">
            <div className="space-y-8">
              <div className="space-y-3 text-center">
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground sm:text-[12px]">
                  Вопрос {absoluteQuestionIndex + 1} из {overallTotal}
                </p>
                <div className="mx-auto h-[3px] w-full max-w-xl overflow-hidden rounded-full bg-[var(--progress-track)]">
                  <div
                    className="h-full rounded-full shadow-[0_0_12px_rgba(45,211,191,0.4)]"
                    style={{
                      background: "var(--progress-fill)",
                      width: `${overallProgress}%`,
                    }}
                    aria-label={completionLabel(overallTotal ? overallAnswered / overallTotal : 0)}
                  />
                </div>
              </div>

              <div className={cn("mx-auto flex max-w-[56rem] flex-col items-center text-center", questionMotionClass)}>
                <Badge className="status-chip border-white/10 bg-white/5 shadow-none">
                  {blockLabel(currentBlock.id)} · {questionPositionInBlock}/{currentProgress.total}
                </Badge>

                <h2 className="mt-6 text-[0.92rem] font-medium uppercase tracking-[0.28em] text-cyan-200/72">
                  {currentBlock.title}
                </h2>

                <h1 className="mt-5 max-w-[15ch] font-display text-3xl leading-[1.02] tracking-tight text-white balance-text sm:text-4xl lg:text-[4.15rem]">
                  {currentResponse.russianText}
                </h1>

                <div className="mt-5 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary/80 shadow-[0_0_10px_var(--surface-glow)]" />
                  <span className="size-1.5 rounded-full bg-primary/45" />
                  <span className="size-1.5 rounded-full bg-primary/25" />
                </div>

                <div className="mt-10 w-full max-w-[34rem]">
                  <LikertScale
                    value={currentResponse.answer}
                    disabled={isAdvancing}
                    onChange={(answer) => void handleAnswer(answer)}
                  />
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 space-y-5">
              <div className="glow-divider" />

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    className="dashboard-outline-button h-10 rounded-full px-5 text-white"
                    disabled={!previousLocation}
                    onClick={() => void handleBack()}
                  >
                    <ArrowLeft className="size-4" />
                    Назад
                  </Button>
                  <p className="text-base tracking-tight text-foreground/88">
                    {currentProgress.answered} / {currentProgress.total}
                  </p>
                  <Badge className="status-chip border-white/10 bg-white/5 shadow-none">
                    {statusLabel(currentProgress.status)}
                  </Badge>
                </div>

                <div className="grid w-full gap-3 lg:grid-cols-3">
                  {TEST_BLOCKS.map((block) => {
                    const progress = profile.assessmentProgress[block.id];
                    const active = block.id === currentBlock.id;

                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "dashboard-card-soft rounded-[1.45rem] border px-4 py-3 text-left transition-all",
                          active
                            ? "border-cyan-300/24 bg-[linear-gradient(180deg,rgba(45,211,191,0.12),rgba(255,255,255,0.02))]"
                            : "border-white/10 bg-white/[0.03]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="section-kicker text-muted-foreground/80">
                              Блок {block.order}
                            </p>
                            <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
                              {block.title}
                            </p>
                          </div>
                          {progress.status === "completed" ? (
                            <CheckCircle2 className="mt-1 size-4 text-primary" />
                          ) : null}
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--progress-track)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              background:
                                progress.status === "not-started"
                                  ? "var(--progress-fill-muted)"
                                  : "var(--progress-fill)",
                              width: `${progress.completionRatio * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/78">
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
    </div>
  );
}
