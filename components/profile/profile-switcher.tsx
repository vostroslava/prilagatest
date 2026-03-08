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
        className="control-surface rounded-full text-muted-foreground hover:text-foreground"
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
        <SelectTrigger className="h-10 min-w-[190px] rounded-full px-3 text-sm shadow-none">
          <span className="truncate">
            {currentProfile?.profileMeta.displayName ?? "Выберите профиль"}
          </span>
        </SelectTrigger>
        <SelectContent>
          {profiles.map((profile) => (
            <SelectItem key={profile.profileMeta.id} value={profile.profileMeta.id}>
              <div className="flex flex-col">
                <span>{profile.profileMeta.displayName}</span>
                <span className="text-xs text-muted-foreground">
                  Обновлён {formatDate(profile.profileMeta.updatedAt)}
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
          className="control-surface rounded-full text-muted-foreground hover:text-foreground"
        >
          <Link href={`/profiles/${currentProfileId}/tests`} aria-label="Продолжить тест">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
