"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

interface ResultsViewProps {
  profileId: string;
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

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/10">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {profile.profileMeta.status === "ready" ? "Профиль готов" : "Черновик"}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Обновлён {formatDate(profile.profileMeta.updatedAt)}
            </Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <CardTitle className="font-display text-4xl">
                {profile.profileMeta.displayName}
              </CardTitle>
              <p className="max-w-3xl text-lg leading-8 text-foreground/90">
                {profile.textualInterpretation.shortProfile}
              </p>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                {profile.textualInterpretation.detailedProfile}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-background/45 p-5">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Локальный контекст
              </p>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p>
                  Контексты:{" "}
                  {profile.profileMeta.contexts.map(contextLabel).join(", ") || "не указаны"}
                </p>
                <p>О себе: {profile.profileMeta.about || "—"}</p>
                <p>Хранение: локально на устройстве, без обязательного сервера.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href={`/profiles/${profile.profileMeta.id}/raw-data`}>
                    Открыть сырые данные
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/profiles/${profile.profileMeta.id}/tests`}>
                    Вернуться к тестам
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="glass-panel border-white/10 xl:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Большая пятёрка</CardTitle>
            <CardDescription>
              Нормализованное описание пяти широких личностных факторов.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bigFiveData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(214,221,221,0.7)" />
                <YAxis stroke="rgba(214,221,221,0.7)" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="rgba(88, 181, 176, 0.88)" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10 xl:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-2xl">IPIP-IPC</CardTitle>
            <CardDescription>
              Восемь секторов межличностного круга и их общая геометрия.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={ipcData}>
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "rgba(214,221,221,0.8)", fontSize: 12 }} />
                  <Radar
                    dataKey="value"
                    stroke="rgba(228,156,81,1)"
                    fill="rgba(228,156,81,0.28)"
                    fillOpacity={1}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ipcDerived.map((score) => (
                <div
                  key={score.key}
                  className="rounded-[1.5rem] border border-white/10 bg-background/45 p-4"
                >
                  <p className="text-sm font-medium text-foreground">{score.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
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

        <Card className="glass-panel border-white/10 xl:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Конфликтный профиль</CardTitle>
            <CardDescription>
              Прикладной модуль v1 для честного описания поведения в напряжённом разговоре.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conflictData} layout="vertical" margin={{ left: 12, right: 16 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                <XAxis type="number" stroke="rgba(214,221,221,0.7)" domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="rgba(214,221,221,0.7)"
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="value" fill="rgba(108, 166, 118, 0.9)" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {profile.scoring["big-five"].map((scale) => (
          <Card key={scale.key} className="glass-panel border-white/10">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">{scale.label}</CardTitle>
                <Badge variant="outline" className="rounded-full">
                  {scale.normalized ?? "—"}
                </Badge>
              </div>
              <CardDescription>{scale.scientificLabel}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              {profile.textualInterpretation.scaleNarratives[scale.key]}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
