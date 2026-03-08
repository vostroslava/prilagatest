"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useProfiles } from "@/components/providers/profiles-provider";
import { formatDate } from "@/lib/presenters";

export function ProfileSwitcher() {
  const { profiles, currentProfile, currentProfileId, setCurrentProfileId } = useProfiles();

  if (!profiles.length) {
    return (
      <Button
        asChild
        size="icon-sm"
        variant="ghost"
        className="shell-control shell-control-icon rounded-full text-muted-foreground hover:text-foreground"
      >
        <Link href="/profiles/new" aria-label="Создать профиль">
          <Plus className="size-4" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentProfileId ?? undefined}
        onValueChange={(value) => setCurrentProfileId(String(value))}
      >
        <SelectTrigger className="dashboard-card-soft min-w-[220px] rounded-full border border-white/10 bg-white/5 px-3.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <span className="truncate">
            {currentProfile?.profileMeta.displayName ?? "Выберите профиль"}
          </span>
        </SelectTrigger>
        <SelectContent className="dashboard-card rounded-[1.5rem] border border-white/10 bg-[rgba(8,14,22,0.96)] p-2 backdrop-blur-xl">
          {profiles.map((profile) => (
            <SelectItem key={profile.profileMeta.id} value={profile.profileMeta.id}>
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`size-2 rounded-full ${
                    profile.profileMeta.id === currentProfileId
                      ? "bg-cyan-300 shadow-[0_0_10px_rgba(45,211,191,0.85)]"
                      : "bg-white/20"
                  }`}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{profile.profileMeta.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                  Обновлён {formatDate(profile.profileMeta.updatedAt)}
                  </span>
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentProfileId ? (
        <Button
          asChild
          size="icon-sm"
          variant="ghost"
          className="shell-control shell-control-icon rounded-full text-muted-foreground hover:text-foreground"
        >
          <Link href={`/profiles/${currentProfileId}/tests`} aria-label="Продолжить тест">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
