"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_CONTEXT_OPTIONS } from "@/lib/presenters";
import { cn } from "@/lib/utils";
import type { ProfileContext } from "@/types/assessment";
import type { StoredProfile } from "@/types/profile";

interface ProfileFormProps {
  profile?: StoredProfile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const { createProfile, updateProfileDetails } = useProfiles();
  const [displayName, setDisplayName] = React.useState(profile?.profileMeta.displayName ?? "");
  const [about, setAbout] = React.useState(profile?.profileMeta.about ?? "");
  const [contexts, setContexts] = React.useState<ProfileContext[]>(
    profile?.profileMeta.contexts ?? ["for-self"],
  );
  const [isSaving, startTransition] = React.useTransition();

  function toggleContext(context: ProfileContext) {
    setContexts((current) =>
      current.includes(context)
        ? current.filter((entry) => entry !== context)
        : [...current, context],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      if (profile) {
        const next = await updateProfileDetails(profile.profileMeta.id, {
          displayName,
          about,
          contexts,
        });

        if (next) {
          router.push(`/profiles/${next.profileMeta.id}/tests`);
        }

        return;
      }

      const next = await createProfile({
        displayName,
        about,
        contexts,
      });

      router.push(`/profiles/${next.profileMeta.id}/tests`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="font-display text-3xl">
            {profile ? "Редактировать локальный профиль" : "Создать локальный профиль"}
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            Данные по умолчанию остаются на устройстве. Эта версия не использует
            серверное хранилище профилей и не строит автоматические выводы о
            совместимости.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Имя или псевдоним</label>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Например, Алина"
                className="h-12 rounded-2xl"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Короткая заметка о себе
              </label>
              <Textarea
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                placeholder="Необязательно. Например: «Собираю профиль для личного понимания и сравнения в отношениях»."
                className="min-h-32 rounded-3xl"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Контексты профиля</p>
                <p className="text-sm text-muted-foreground">
                  Можно выбрать несколько. Это не влияет на scoring, но помогает
                  сохранить цель профиля в экспорте.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {PROFILE_CONTEXT_OPTIONS.map((option) => {
                  const active = contexts.includes(option.key);

                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={cn(
                        "rounded-[1.5rem] border px-4 py-4 text-left transition-colors",
                        active
                          ? "border-primary/60 bg-primary/10"
                          : "border-white/10 bg-background/40 hover:border-primary/30",
                      )}
                      onClick={() => toggleContext(option.key)}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {active ? <Badge className="rounded-full">Выбрано</Badge> : null}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                size="lg"
                className="rounded-full px-6"
                disabled={isSaving || !displayName.trim()}
              >
                {profile ? "Сохранить и продолжить" : "Создать профиль и перейти к тестам"}
              </Button>
              <p className="text-sm text-muted-foreground">
                В первой версии нет обязательной регистрации и нет удалённой базы данных
                профилей.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Что сохранится в профиле</CardTitle>
          <CardDescription>
            Всё это потом попадёт в полный экспорт и comparison-package.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>1. Основные метаданные профиля и выбранные контексты.</p>
          <p>2. Все ответы по Big Five, IPIP-IPC и внутреннему конфликтному модулю.</p>
          <p>3. Вычисленные шкалы, производные показатели и текстовые интерпретации.</p>
          <p>4. Сырые вопросы с оригинальными формулировками, русским текстом и item IDs.</p>
          <p>5. Версии методик и расчётные примечания для ручного внешнего анализа.</p>
        </CardContent>
      </Card>
    </div>
  );
}
