"use client";

import * as React from "react";
import Link from "next/link";
import { Download, FileJson, FileSearch, Upload } from "lucide-react";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { contextLabel, formatDate } from "@/lib/presenters";

export function LocalHub() {
  const { profiles, importProfileFromObject, hydrated } = useProfiles();
  const [message, setMessage] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

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
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="glass-panel border-white/10">
          <CardHeader className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Версия 1
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                local-first
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                ручной анализ совместимости
              </Badge>
            </div>
            <div className="space-y-4">
              <CardTitle className="font-display text-5xl leading-tight">
                Локальный веб-продукт
                <br />
                для самопонимания
              </CardTitle>
              <CardDescription className="max-w-3xl text-lg leading-8">
                Первая рабочая версия аккуратно собирает живой профиль личности через три
                блока: Big Five, межличностный круг и прикладной конфликтный модуль. Все
                данные хранятся локально, экспортируются полностью и могут быть переданы
                на внешний ручной разбор.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/10 bg-background/45 p-4">
              <FileSearch className="mb-3 size-5 text-primary" />
              <p className="font-medium text-foreground">3 тестовых блока</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Каждый вопрос сохраняется со своим item ID, источником, переводом и
                ответом.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-background/45 p-4">
              <FileJson className="mb-3 size-5 text-primary" />
              <p className="font-medium text-foreground">Полный JSON-экспорт</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                В файле лежат rawAnswers, scoring, derivedScores, textualInterpretation и
                версия методики.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-background/45 p-4">
              <Download className="mb-3 size-5 text-primary" />
              <p className="font-medium text-foreground">Сравнение без вердикта</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Продукт не считает «совместимость в процентах», а подготавливает пакет для
                ручного анализа.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Быстрые действия</CardTitle>
            <CardDescription>
              Начните новый профиль, импортируйте JSON или сразу откройте режим сравнения.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full rounded-full">
              <Link href="/profiles/new">Создать локальный профиль</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full rounded-full">
              <Link href="/compare">Сравнить два полных профиля</Link>
            </Button>
            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-full border border-dashed border-white/20 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              <Upload className="size-4" />
              Импортировать профиль из JSON
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
            </label>
            {message ? (
              <p className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Локальные профили</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {hydrated
                ? "Профили лежат в IndexedDB на этом устройстве."
                : "Загружаем локальное хранилище…"}
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {profiles.length} профилей
          </Badge>
        </div>

        {profiles.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {profiles.map((profile) => (
              <Card key={profile.profileMeta.id} className="glass-panel border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl">{profile.profileMeta.displayName}</CardTitle>
                      <CardDescription className="mt-2">
                        Обновлён {formatDate(profile.profileMeta.updatedAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {profile.profileMeta.status === "ready" ? "Готов" : "Черновик"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    {profile.textualInterpretation.shortProfile}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileMeta.contexts.map((context) => (
                      <Badge key={context} variant="secondary" className="rounded-full">
                        {contextLabel(context)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-full">
                      <Link href={`/profiles/${profile.profileMeta.id}/tests`}>Открыть тесты</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/profiles/${profile.profileMeta.id}/results`}>Результат</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/profiles/${profile.profileMeta.id}/raw-data`}>Экспорт</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-panel border-white/10">
            <CardContent className="py-12 text-center">
              <p className="font-display text-2xl">Пока нет ни одного локального профиля</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                Создайте первый профиль, чтобы пройти три тестовых блока, получить полный
                личный результат и позже сравнить два экспорта рядом.
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link href="/profiles/new">Создать первый профиль</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
