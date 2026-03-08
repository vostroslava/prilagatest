"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { contextLabel, formatDate } from "@/lib/presenters";
import { cn } from "@/lib/utils";

interface ResultsViewProps {
  profileId: string;
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.16 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function tooltipContent(label: string | undefined, value: number | string | undefined) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#0d1012]/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{value ?? "—"} / 100</p>
    </div>
  );
}

export function ResultsView({ profileId }: ResultsViewProps) {
  const { profiles } = useProfiles();
  const profile = profiles.find((entry) => entry.profileMeta.id === profileId) ?? null;

  if (!profile) {
    return (
      <Card className="glass-panel border-white/10">
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

  const chartToken = profile.profileMeta.id.slice(0, 8);
  const bigFiveData = profile.scoring["big-five"].map((scale) => ({
    name: scale.shortLabel,
    value: scale.normalized ?? 0,
  }));
  const ipcData = profile.scoring["ipip-ipc"].map((scale) => ({
    name: scale.shortLabel,
    value: scale.normalized ?? 0,
  }));
  const conflictData = profile.scoring["conflict-profile"].map((scale) => ({
    name: scale.shortLabel,
    value: scale.normalized ?? 0,
  }));
  const ipcDerived = profile.derivedScores.filter((score) => score.blockId === "ipip-ipc");
  const strongestTraits = [...profile.scoring["big-five"]]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (right.normalized ?? 0) - (left.normalized ?? 0))
    .slice(0, 3);
  const quieterTraits = [...profile.scoring["big-five"]]
    .filter((scale) => scale.normalized !== null)
    .sort((left, right) => (left.normalized ?? 0) - (right.normalized ?? 0))
    .slice(0, 2);

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2.75rem] border border-white/6 bg-[#09090b]/88 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(71,170,165,0.2),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(189,146,84,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_26%)]" />

        <div className="relative grid gap-8 px-6 py-7 sm:px-8 sm:py-9 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                {profile.profileMeta.status === "ready" ? "Профиль готов" : "Черновик"}
              </Badge>
              <Badge className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                Обновлён {formatDate(profile.profileMeta.updatedAt)}
              </Badge>
            </div>

            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground/75">
                Личный профиль {profile.profileMeta.displayName}
              </p>
              <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
                {profile.textualInterpretation.shortProfile}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-foreground/86 sm:text-lg">
                {profile.textualInterpretation.detailedProfile}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full border border-white/10 bg-white/[0.08] px-5 hover:bg-white/[0.12]">
                <Link href={`/profiles/${profile.profileMeta.id}/raw-data`}>
                  Открыть сырые данные
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-white/8 bg-white/[0.03] px-5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              >
                <Link href={`/profiles/${profile.profileMeta.id}/tests`}>
                  Вернуться к тестам
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.35rem] border border-white/8 bg-white/[0.04] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.09),transparent_35%),radial-gradient(circle_at_50%_110%,rgba(71,170,165,0.18),transparent_40%)]" />

            <div className="relative space-y-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                  Срез на сейчас
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  Это локальный снимок склонностей и рабочих паттернов. Он нужен для
                  размышления и ручного сравнения, а не для окончательных ярлыков.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    На переднем плане
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {strongestTraits.map((trait) => (
                      <span
                        key={trait.key}
                        className="rounded-full border border-emerald-300/12 bg-emerald-300/8 px-3 py-2 text-sm text-emerald-100/90"
                      >
                        {trait.label} · {trait.normalized}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Более спокойные зоны
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quieterTraits.map((trait) => (
                      <span
                        key={trait.key}
                        className="rounded-full border border-amber-300/12 bg-amber-300/8 px-3 py-2 text-sm text-amber-100/90"
                      >
                        {trait.label} · {trait.normalized}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
                    Локальный контекст
                  </p>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                    <p>
                      Контексты:{" "}
                      {profile.profileMeta.contexts.map(contextLabel).join(", ") || "не указаны"}
                    </p>
                    <p>О себе: {profile.profileMeta.about || "—"}</p>
                    <p>Хранение: только локально, без обязательного сервера.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Reveal>
          <Card className="glass-panel relative overflow-hidden border-white/8 bg-white/[0.04]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(74,170,166,0.18),transparent_42%)]" />
            <CardHeader className="relative">
              <CardTitle className="font-display text-3xl">Большая пятёрка</CardTitle>
              <CardDescription>
                Широкий рисунок личности без сухой приборной панели.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={bigFiveData}>
                  <defs>
                    <linearGradient id={`big-five-fill-${chartToken}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(101,213,205,0.7)" />
                      <stop offset="100%" stopColor="rgba(101,213,205,0.1)" />
                    </linearGradient>
                    <filter id={`big-five-glow-${chartToken}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" radialLines={false} />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fill: "rgba(230,235,235,0.78)", fontSize: 12 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="rgba(101,213,205,1)"
                    strokeWidth={2.3}
                    fill={`url(#big-five-fill-${chartToken})`}
                    fillOpacity={1}
                    filter={`url(#big-five-glow-${chartToken})`}
                  />
                  <Tooltip content={({ active, payload, label }) => (active ? tooltipContent(String(label), payload?.[0]?.value as number | undefined) : null)} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={90}>
          <Card className="glass-panel relative overflow-hidden border-white/8 bg-white/[0.04]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,145,82,0.18),transparent_42%)]" />
            <CardHeader className="relative">
              <CardTitle className="font-display text-3xl">Межличностный круг</CardTitle>
              <CardDescription>
                Восемь секторов и общая геометрия взаимодействия.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-5">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={ipcData}>
                    <defs>
                      <linearGradient id={`ipc-fill-${chartToken}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(232,170,102,0.78)" />
                        <stop offset="100%" stopColor="rgba(232,170,102,0.08)" />
                      </linearGradient>
                      <filter id={`ipc-glow-${chartToken}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fill: "rgba(230,235,235,0.78)", fontSize: 11 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="rgba(232,170,102,1)"
                    strokeWidth={2.3}
                    fill={`url(#ipc-fill-${chartToken})`}
                    fillOpacity={1}
                    filter={`url(#ipc-glow-${chartToken})`}
                  />
                  <Tooltip content={({ active, payload, label }) => (active ? tooltipContent(String(label), payload?.[0]?.value as number | undefined) : null)} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ipcDerived.map((score) => (
                  <div
                    key={score.key}
                    className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/70">
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
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <Card className="glass-panel relative overflow-hidden border-white/8 bg-white/[0.04]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(118,175,134,0.16),transparent_42%)]" />
            <CardHeader className="relative">
              <CardTitle className="font-display text-3xl">Конфликтный профиль</CardTitle>
              <CardDescription>
                Внутренний прикладной модуль v1 для описания напряжённых разговоров.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conflictData} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <defs>
                    <linearGradient id={`conflict-fill-${chartToken}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(124,193,142,0.35)" />
                      <stop offset="100%" stopColor="rgba(124,193,142,0.96)" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="rgba(230,235,235,0.35)"
                    tick={{ fill: "rgba(230,235,235,0.45)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="rgba(230,235,235,0.65)"
                    tick={{ fill: "rgba(230,235,235,0.7)", fontSize: 11 }}
                    width={112}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={({ active, payload, label }) => (active ? tooltipContent(String(label), payload?.[0]?.value as number | undefined) : null)} />
                  <Bar dataKey="value" fill={`url(#conflict-fill-${chartToken})`} radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(
          [
            ["big-five", "Темперамент и способ собирать опыт"],
            ["ipip-ipc", "Как вы входите в контакт и держите дистанцию"],
            ["conflict-profile", "Как переживаете напряжение и возвращаетесь к диалогу"],
          ] as const
        ).map(([blockId, eyebrow], index) => (
          <Reveal key={blockId} delay={index * 80}>
            <Card className="glass-panel h-full border-white/8 bg-white/[0.04]">
              <CardHeader className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                  {eyebrow}
                </p>
                <CardTitle className="font-display text-2xl">
                  {profile.textualInterpretation.blockSummaries[blockId]}
                </CardTitle>
              </CardHeader>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {profile.scoring["big-five"].map((scale, index) => (
          <Reveal key={scale.key} delay={index * 70}>
            <Card className="glass-panel h-full border-white/8 bg-white/[0.04]">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl tracking-tight">{scale.label}</CardTitle>
                  <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm shadow-none">
                    {scale.normalized ?? "—"}
                  </Badge>
                </div>
                <CardDescription>{scale.scientificLabel}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {profile.textualInterpretation.scaleNarratives[scale.key]}
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card className="glass-panel border-white/8 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Ограничения и аккуратность</CardTitle>
            <CardDescription>
              Этот экран помогает замечать паттерны, а не подменять живое понимание
              человека итоговым ярлыком.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-3">
            {profile.textualInterpretation.disclaimers.map((note) => (
              <div
                key={note}
                className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-muted-foreground"
              >
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
