"use client";

import Link from "next/link";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBar } from "@/components/visuals/metric-bar";
import { ProfileRadar } from "@/components/visuals/profile-radar";
import { contextLabel, formatDate, syncStatusLabel } from "@/lib/presenters";

interface ResultsViewProps {
  profileId: string;
}

export function ResultsView({ profileId }: ResultsViewProps) {
  const { profiles } = useProfiles();
  const profile = profiles.find((entry) => entry.profileMeta.id === profileId) ?? null;

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
        <div className="dashboard-card-strong flex flex-col justify-between rounded-[2.5rem] p-6 sm:p-7">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="status-chip shadow-none">
                {profile.profileMeta.status === "ready" ? "Профиль готов" : "Черновик"}
              </Badge>
              <Badge className="status-chip shadow-none">
                Обновлён {formatDate(profile.profileMeta.updatedAt)}
              </Badge>
              <Badge className="status-chip shadow-none">
                {syncStatusLabel(profile.syncMeta?.status)}
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="section-kicker text-primary/70">
                My Profile
              </p>
              <h1 className="text-gradient font-display text-5xl leading-[0.98] tracking-tight">
                {profile.profileMeta.displayName}
              </h1>
              <p className="max-w-[32rem] text-base leading-8 text-foreground/86">
                {profile.textualInterpretation.shortProfile}
              </p>
              <p className="max-w-[34rem] text-sm leading-7 text-muted-foreground">
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
          </div>
        </div>

        <div className="dashboard-card-strong rounded-[2.5rem] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="section-kicker">
                  Big Five
                </p>
                <div className="glow-divider mt-4" />
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
              primaryStroke="#00E5FF"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="dashboard-card rounded-[2rem] p-5">
            <p className="section-kicker">
              Strengths
            </p>
            <div className="glow-divider mt-4" />
            <div className="mt-4 space-y-4">
              {strongestTraits.map((trait) => (
                <div key={trait.key} className="dashboard-card-soft rounded-[1.45rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold tracking-tight text-foreground">{trait.label}</p>
                    <Badge className="metric-chip shadow-none">
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

          <div className="dashboard-card rounded-[2rem] p-5">
            <p className="section-kicker">
              Zones of tension
            </p>
            <div className="glow-divider mt-4" />
            <div className="mt-4 space-y-4">
              {quieterTraits.map((trait) => (
                <div key={trait.key} className="dashboard-card-soft rounded-[1.45rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold tracking-tight text-foreground">{trait.label}</p>
                    <Badge className="metric-chip shadow-none">
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
        <div className="dashboard-card rounded-[2.4rem] p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <p className="section-kicker">
                Interpersonal Style
              </p>
              <h2 className="text-gradient font-display text-3xl tracking-tight">
                Как вы занимаете пространство рядом с другим человеком
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {profile.textualInterpretation.blockSummaries["ipip-ipc"]}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {ipcDerived.map((score) => (
                  <div
                    key={score.key}
                    className="quiet-panel rounded-[1.4rem] p-4"
                  >
                    <p className="section-kicker text-muted-foreground/76">
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
              primaryStroke="#00E5FF"
            />
          </div>
        </div>

        <div className="dashboard-card rounded-[2.4rem] p-6">
          <div className="space-y-5">
            <div>
              <p className="section-kicker">
                Conflict Profile
              </p>
              <h2 className="text-gradient mt-3 font-display text-3xl tracking-tight">
                Напряжение, защита и восстановление
              </h2>
              <div className="glow-divider mt-4" />
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
        <div className="dashboard-card rounded-[2rem] p-5">
          <p className="section-kicker">
            Context
          </p>
          <div className="glow-divider mt-4" />
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.profileMeta.contexts.map((context) => (
              <Badge
                key={context}
                className="status-chip shadow-none"
              >
                {contextLabel(context)}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {profile.profileMeta.about || "Дополнительная заметка пока не заполнена."}
          </p>
        </div>

        <div className="dashboard-card rounded-[2rem] p-5">
          <p className="section-kicker">
            Interpretation
          </p>
          <div className="glow-divider mt-4" />
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {profile.textualInterpretation.blockSummaries["big-five"]}
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {profile.textualInterpretation.blockSummaries["ipip-ipc"]}
          </p>
        </div>

        <div className="dashboard-card rounded-[2rem] p-5">
          <p className="section-kicker">
            Limits
          </p>
          <div className="glow-divider mt-4" />
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
            {profile.textualInterpretation.disclaimers.map((note) => (
              <div key={note} className="quiet-panel rounded-[1.4rem] p-4">
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
