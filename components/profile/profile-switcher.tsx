"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfiles } from "@/components/providers/profiles-provider";
import { formatDate } from "@/lib/presenters";

export function ProfileSwitcher() {
  const { profiles, currentProfileId, setCurrentProfileId } = useProfiles();

  if (!profiles.length) {
    return (
      <Button asChild size="sm" className="rounded-full">
        <Link href="/profiles/new">
          <Plus className="size-4" />
          Создать профиль
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Select
        value={currentProfileId ?? undefined}
        onValueChange={(value) => setCurrentProfileId(String(value))}
      >
        <SelectTrigger className="w-full min-w-[220px] rounded-full md:w-[260px]">
          <SelectValue placeholder="Выберите профиль" />
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

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/profiles/new">
            <Plus className="size-4" />
            Новый
          </Link>
        </Button>
        {currentProfileId ? (
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/profiles/${currentProfileId}/tests`}>
              Продолжить
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
