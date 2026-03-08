"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Download, FileJson, Sparkles, Upload } from "lucide-react";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEST_BLOCKS } from "@/content/tests";
import { contextLabel, formatDate } from "@/lib/presenters";
import { MetricBar } from "@/components/visuals/metric-bar";
import { MiniRing } from "@/components/visuals/mini-ring";
import { ProfileRadar } from "@/components/visuals/profile-radar";

const PLACEHOLDER_RADAR = [
  { label: "Open", value: 74 },
  { label: "Cons", value: 66 },
  { label: "Extra", value: 58 },
  { label: "Agree", value: 71 },
  { label: "Neuro", value: 42 },
];

export function LocalHub() {
  const { profiles, currentProfile, importProfileFromObject, hydrated } = useProfiles();
  const [message, setMessage] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const focusProfile = currentProfile ?? profiles[0] ?? null;
  const heroRadarData = focusProfile
    ? focusProfile.scoring["big-five"].map((scale) => ({
        label: scale.shortLabel,
        value: scale.normalized ?? 0,
      }))
    : PLACEHOLDER_RADAR;
  const focusSummary = focusProfile
    ? focusProfile.textualInterpretation.shortProfile
    : "Создайте первый профиль, чтобы увидеть живую цифровую карту склонностей, шкал и паттернов взаимодействия.";
  const focusTraits = focusProfile
    ? [...focusProfile.scoring["big-five"]]
        .filter((scale) => scale.normalized !== null)
        .sort((left, right) => (right.normalized ?? 0) - (left.normalized ?? 0))
        .slice(0, 4)
    : [];

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      await importProfileFromObject(JSON.parse(text));
      setMessage(`Импорт завершён: ${file.name}`);
      setError("");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Не удалось импортировать файл.");
      setMessage("");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.15fr_0.85fr]">
        <div className="glass-panel flex flex-col justify-between rounded-[2.25rem] p-6 sm:p-7">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                Local-first
              </Badge>
              <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
                Premium v1
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70">
                Welcome back
              </p>
              <h1 className="font-display text-5xl leading-[0.98] tracking-tight text-foreground sm:text-6xl">
                Готовы исследовать свой живой профиль?
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">
                Здесь остаются не “итоговые проценты”, а полный цифровой профиль:
                вопросы, шкалы, контексты, экспорт и сравнение двух людей без
                автоматического вердикта.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-full px-5"
              >
                <Link href={focusProfile ? `/profiles/${focusProfile.profileMeta.id}/tests` : "/profiles/new"}>
                  {focusProfile ? "Продолжить тест" : "Создать профиль"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-5"
              >
                <Link href="/compare">Открыть сравнение</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="panel-inset rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/70">
                Полный экспорт
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                JSON, Markdown и короткая сводка доступны из каждого профиля без сервера.
              </p>
            </div>
            <div className="panel-inset rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/70">
                Ручной анализ
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Продукт собирает материал для осмысленного сравнения, а не выносит вердикт.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-[2.4rem] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr]">
            <div className="flex flex-col justify-between gap-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                  My Personality Profile
                </p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {focusSummary}
                </p>
              </div>

              <div className="space-y-4">
                {focusTraits.length ? (
                  focusTraits.map((trait) => (
                    <MetricBar
                      key={trait.key}
                      label={trait.label}
                      value={trait.normalized ?? 0}
                    />
                  ))
                ) : (
                  PLACEHOLDER_RADAR.map((trait) => (
                    <MetricBar key={trait.label} label={trait.label} value={trait.value} muted />
                  ))
                )}
              </div>
            </div>

            <ProfileRadar
              data={heroRadarData}
              className="min-h-[360px]"
              height={420}
              centerLabel={focusProfile ? "Личный профиль" : "Preview"}
              centerValue={focusProfile ? focusProfile.profileMeta.displayName : "Profile"}
              primaryLabel={focusProfile?.profileMeta.displayName ?? "Preview"}
            />
          </div>
        </div>

        <div className="space-y-4">
          {TEST_BLOCKS.map((block) => {
            const progress = focusProfile?.assessmentProgress[block.id];
            const percent = progress ? Math.round(progress.completionRatio * 100) : 0;

            return (
              <div key={block.id} className="glass-panel rounded-[2rem] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/65">
                      Модуль
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                      {block.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {block.subtitle}
                    </p>
                  </div>
                  <MiniRing value={percent} />
                </div>

                <div className="mt-5 space-y-3">
                  <MetricBar
                    label={`${progress?.answered ?? 0}/${progress?.total ?? block.questions.length} ответов`}
                    value={percent}
                  />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {progress?.status === "completed"
                        ? "Завершён"
                        : progress?.status === "in-progress"
                          ? "В процессе"
                          : "Готов к старту"}
                    </span>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full px-4"
                    >
                      <Link href={focusProfile ? `/profiles/${focusProfile.profileMeta.id}/tests` : "/profiles/new"}>
                        {focusProfile ? "Открыть" : "Begin"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[2.35rem] p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground/70">
                Profiles
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground">
                Локальные профили на этом устройстве
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {hydrated
                  ? "Все профили живут в IndexedDB и могут быть экспортированы полностью."
                  : "Загружаем локальное хранилище…"}
              </p>
            </div>
            <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-sm shadow-none">
              {profiles.length}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {profiles.length ? (
              profiles.map((profile) => (
                <div
                  key={profile.profileMeta.id}
                  className="panel-inset rounded-[1.8rem] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-foreground">
                        {profile.profileMeta.displayName}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Обновлён {formatDate(profile.profileMeta.updatedAt)}
                      </p>
                    </div>
                    <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 shadow-none">
                      {profile.profileMeta.status === "ready" ? "Готов" : "Черновик"}
                    </Badge>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {profile.textualInterpretation.shortProfile}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.profileMeta.contexts.map((context) => (
                      <Badge
                        key={context}
                        className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground shadow-none"
                      >
                        {contextLabel(context)}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild className="rounded-full px-4">
                      <Link href={`/profiles/${profile.profileMeta.id}/results`}>Открыть</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-4">
                      <Link href={`/profiles/${profile.profileMeta.id}/raw-data`}>Экспорт</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="panel-inset rounded-[1.8rem] border-dashed p-8 text-center lg:col-span-2">
                <p className="font-display text-3xl tracking-tight text-foreground">
                  Пока нет ни одного профиля
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                  Создайте первый профиль, чтобы увидеть персональную карту, пройти три
                  модуля и подготовить экспорт для ручного анализа.
                </p>
                <Button asChild className="mt-6 rounded-full px-5">
                  <Link href="/profiles/new">Создать первый профиль</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-primary">
                <Upload className="size-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  Import
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Импортировать профиль
                </h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Поддерживается полный JSON-экспорт со шкалами, сырыми ответами и текстовыми
              интерпретациями.
            </p>
            <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 rounded-full border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-white/22 hover:bg-white/[0.06] hover:text-foreground">
              <Upload className="size-4" />
              Импортировать JSON
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
            </label>
          </div>

          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-primary">
                <FileJson className="size-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  Export
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Технический пакет
                </h3>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="panel-inset rounded-[1.4rem] p-4 text-sm leading-7 text-muted-foreground">
                `profileMeta`, `rawAnswers`, `scoring`, `derivedScores`, `textualInterpretation`,
                `scaleDefinitions`, `versionInfo`.
              </div>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={focusProfile ? `/profiles/${focusProfile.profileMeta.id}/raw-data` : "/profiles/new"}>
                  Открыть экран экспорта
                  <Download className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  Notes
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Система v1
                </h3>
              </div>
            </div>

            {message ? (
              <div className="mt-4 rounded-[1.4rem] border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-[1.4rem] border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
                {error}
              </div>
            ) : null}

            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Никаких автоматических процентов совместимости внутри продукта.</p>
              <p>Никакого внешнего серверного хранилища профилей в базовом сценарии.</p>
              <p>Вся аналитика остаётся аккуратной, descriptive и пригодной для ручного разбора.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
