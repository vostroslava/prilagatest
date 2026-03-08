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
  const { createProfile, updateProfileDetails, authStatus } = useProfiles();
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
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <Card className="dashboard-card-strong rounded-[2.4rem] border-[color:var(--surface-border)]">
        <CardHeader className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge className="status-chip shadow-none">
              {profile ? "Edit profile" : "Create profile"}
            </Badge>
            <Badge className="status-chip shadow-none">
              {authStatus === "authenticated" ? "sync on create" : "local-only"}
            </Badge>
          </div>
          <div className="space-y-4">
            <CardTitle className="font-display text-5xl leading-[0.98] tracking-tight text-foreground">
              {profile ? "Обновить локальный профиль" : "Создать новый живой профиль"}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-8">
              Данные остаются на устройстве и становятся основой для прохождения тестов,
              полного экспорта и последующего ручного сравнения двух людей.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Имя / псевдоним
                  </label>
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Например, Алина"
                    className="h-13 rounded-[1.4rem] text-base"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Контексты
                  </label>
                  <div className="grid gap-3">
                    {PROFILE_CONTEXT_OPTIONS.map((option) => {
                      const active = contexts.includes(option.key);

                      return (
                        <button
                          key={option.key}
                          type="button"
                          className={cn(
                            "quiet-panel rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-300",
                            active
                              ? "border-primary/35 bg-[var(--surface-control-active)] shadow-[0_0_24px_var(--surface-glow)]"
                              : "hover:border-[color:var(--surface-border-strong)]",
                          )}
                          onClick={() => toggleContext(option.key)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-foreground">{option.label}</span>
                            {active ? (
                              <Badge className="status-chip px-3 shadow-none">
                                active
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  О себе
                </label>
                <Textarea
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  placeholder="Например: “Собираю профиль для личного понимания и будущего сравнения в отношениях”."
                  className="min-h-[340px] rounded-[1.8rem] text-base"
                />
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
                Регистрация не обязательна. В гостевом режиме профиль останется только локально,
                а после входа сможет сразу пойти в sync.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="dashboard-card rounded-[2.4rem] border-[color:var(--surface-border)]">
        <CardHeader>
          <CardTitle className="font-display text-3xl tracking-tight">
            Что сохранится в пакете профиля
          </CardTitle>
          <CardDescription>
            Это не просто анкета. После прохождения блоков появится полный исследовательский
            пакет для дальнейшей ручной работы.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            "Основные метаданные профиля и выбранные контексты.",
            "Все ответы по Big Five, IPIP-IPC и внутреннему конфликтному модулю.",
            "Вычисленные шкалы, производные показатели и текстовые интерпретации.",
            "Сырые вопросы с оригинальными формулировками, русским текстом и item IDs.",
            "Версии методик и расчётные примечания для ручного внешнего анализа.",
          ].map((item, index) => (
            <div
              key={item}
              className="quiet-panel rounded-[1.5rem] p-4 text-sm leading-7 text-muted-foreground"
            >
              <span className="mr-3 font-semibold text-foreground/85">{index + 1}.</span>
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
