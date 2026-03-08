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
    <div className="relative flex flex-col min-h-[100dvh] bg-background selection:bg-primary/30">
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(120,200,200,0.5)]"
          style={{ width: `${overallProgress}%` }}
          aria-label={completionLabel(overallTotal ? overallAnswered / overallTotal : 0)}
        />
      </div>

      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="rounded-full size-10 border border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            disabled={!previousLocation || isAdvancing}
            onClick={() => void handleBack()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-mono">
              {blockLabel(currentBlock.id)} • {currentProgress.answered}/{currentProgress.total}
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          className="rounded-full text-[13px] border border-white/5 bg-transparent text-white/50 hover:text-white hover:bg-white/5"
        >
          <Link href={`/profiles/${profile.profileMeta.id}/results`}>
            Приостановить
          </Link>
        </Button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div 
          key={currentResponse.itemId}
          className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60 font-mono">
                {currentResponse.itemId}
              </span>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-[4rem] leading-[1.1] tracking-tight text-gradient font-medium max-w-3xl mx-auto balance-text">
                {currentResponse.russianText}
              </h1>
              
              <p className="text-sm text-white/40 max-w-xl mx-auto">
                {currentBlock.title}
              </p>
            </div>

            <div className="max-w-3xl mx-auto w-full pt-8">
              <LikertScale
                value={currentResponse.answer}
                disabled={isAdvancing}
                onChange={(answer) => void handleAnswer(answer)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sr-only">
        <Badge>{statusLabel(currentProgress.status)}</Badge>
        <span>{absoluteQuestionIndex}</span>
        <span>{remainingInBlock}</span>
        <span>{isCrossingToNextBlock ? upcomingBlock?.title : currentBlock.title}</span>
        <span>{nextLocation?.blockId ?? "final"}</span>
        <span>{cn("runner", TEST_BLOCKS.length > 0 && "ready")}</span>
        {[CheckCircle2, PauseCircle, Sparkles].map((Icon, index) => (
          <Icon key={index} className="size-4" />
        ))}
      </div>
    </div>
  );
}
