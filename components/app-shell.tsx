"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/components/providers/profiles-provider";
import { contextLabel } from "@/lib/presenters";

const navigation = [
  { href: "/", label: "Главная" },
  { href: "/compare", label: "Сравнить два профиля" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentProfileId, currentProfile } = useProfiles();

  const profileNavigation = currentProfileId
    ? [
        { href: `/profiles/${currentProfileId}/tests`, label: "Тесты" },
        { href: `/profiles/${currentProfileId}/results`, label: "Результат" },
        { href: `/profiles/${currentProfileId}/raw-data`, label: "Сырые данные" },
      ]
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(49,122,122,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(192,122,56,0.16),transparent_28%),linear-gradient(180deg,rgba(17,24,24,0.96),rgba(14,18,18,1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="glass-panel sticky top-4 z-20 mb-6 rounded-[2rem] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/" className="font-display text-2xl tracking-tight text-foreground">
                    Личный профиль
                  </Link>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    local-first
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    без ИИ внутри
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Спокойный локальный веб-инструмент для самопонимания: три тестовых
                  блока, живой профиль личности, полный экспорт и ручное сравнение двух
                  людей без автоматического вердикта о совместимости.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <ProfileSwitcher />
                <ThemeToggle />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <nav className="flex flex-wrap gap-2">
                {[...navigation, ...profileNavigation].map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "rounded-full px-4",
                        !active && "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  );
                })}
              </nav>

              {currentProfile ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Активный профиль:</span>
                  <span className="font-medium text-foreground">
                    {currentProfile.profileMeta.displayName}
                  </span>
                  <span>·</span>
                  <span>
                    {currentProfile.profileMeta.contexts.map(contextLabel).join(", ") ||
                      "без контекста"}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
