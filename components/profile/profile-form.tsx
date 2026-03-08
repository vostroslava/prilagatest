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
    <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1.06fr_0.82fr]">
      <Card className="dashboard-card-strong rounded-[2.6rem] border-[color:var(--dashboard-border)]">
        <CardHeader className="space-y-6 px-6 pt-6 sm:px-7 sm:pt-7">
          <div className="flex flex-wrap gap-2">
            <Badge className="status-chip shadow-none">
              {profile ? "Edit profile" : "Create profile"}
            </Badge>
            <Badge className="status-chip shadow-none">
              {authStatus === "authenticated" ? "sync on create" : "local-only"}
            </Badge>
          </div>
          <div className="space-y-4">
            <CardTitle className="font-display text-4xl leading-[1.02] tracking-tight text-foreground sm:text-5xl">
              {profile ? "Обновить локальный профиль" : "Создать новый живой профиль"}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-8">
              Данные остаются на устройстве и становятся основой для прохождения тестов,
              полного экспорта и последующего ручного сравнения двух людей.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-7 sm:pb-7">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="profile-display-name"
                    className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground"
                  >
                    Имя / псевдоним
                  </label>
                  <Input
                    id="profile-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Например, Алина"
                    className="dashboard-field h-14 rounded-[1.6rem] text-base"
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
                            "dashboard-card-soft elevated-hover rounded-[1.65rem] border px-4 py-4 text-left transition-all duration-300",
                            active
                              ? "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(45,211,191,0.16),rgba(255,255,255,0.03))] shadow-[0_0_24px_rgba(45,211,191,0.14)]"
                              : "border-white/10 bg-white/5 hover:border-cyan-300/18",
                          )}
                          onClick={() => toggleContext(option.key)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-foreground">{option.label}</span>
                            {active ? (
                              <Badge className="status-chip border-cyan-300/20 bg-cyan-400/10 px-3 text-cyan-100 shadow-none">
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
                <label
                  htmlFor="profile-about"
                  className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground"
                >
                  О себе
                </label>
                <Textarea
                  id="profile-about"
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  placeholder="Например: “Собираю профиль для личного понимания и будущего сравнения в отношениях”."
                  className="dashboard-field min-h-[340px] rounded-[1.9rem] text-base"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                size="lg"
                className="dashboard-primary-button rounded-full px-6 text-white"
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

      <Card className="dashboard-card rounded-[2.6rem] border-[color:var(--dashboard-border)]">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="font-display text-3xl tracking-tight text-foreground">
            Что сохранится в пакете профиля
          </CardTitle>
          <CardDescription>
            Это не просто анкета. После прохождения блоков появится полный исследовательский
            пакет для дальнейшей ручной работы.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 sm:px-7 sm:pb-7">
          {[
            "Основные метаданные профиля и выбранные контексты.",
            "Все ответы по Big Five, IPIP-IPC и внутреннему конфликтному модулю.",
            "Вычисленные шкалы, производные показатели и текстовые интерпретации.",
            "Сырые вопросы с оригинальными формулировками, русским текстом и item IDs.",
            "Версии методик и расчётные примечания для ручного внешнего анализа.",
          ].map((item, index) => (
            <div
              key={item}
              className="dashboard-card-soft rounded-[1.55rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-muted-foreground"
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
