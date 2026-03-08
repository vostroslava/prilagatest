"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Search } from "lucide-react";

import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProfiles } from "@/components/providers/profiles-provider";
import { cn } from "@/lib/utils";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentProfileId, currentProfile } = useProfiles();

  const navItems = [
    {
      key: "home",
      href: "/",
      label: "Главная",
      active: pathname === "/",
    },
    {
      key: "tests",
      href: currentProfileId ? `/profiles/${currentProfileId}/tests` : "/profiles/new",
      label: "Тесты",
      active: pathname === "/profiles/new" || pathname.includes("/tests"),
    },
    {
      key: "profile",
      href: currentProfileId ? `/profiles/${currentProfileId}/results` : "/profiles/new",
      label: "Мой профиль",
      active: pathname.includes("/results"),
    },
    {
      key: "compare",
      href: "/compare",
      label: "Сравнение",
      active: pathname === "/compare" || pathname.startsWith("/compare/"),
    },
    {
      key: "export",
      href: currentProfileId ? `/profiles/${currentProfileId}/raw-data` : "/profiles/new",
      label: "Экспорт",
      active: pathname.includes("/raw-data"),
    },
  ];

  const isTestRunner = pathname.includes("/tests") && currentProfileId;

  return (
    <div className="relative min-h-screen">
      {!isTestRunner ? (
        <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="glass-panel rounded-[2rem] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Link
                    href="/"
                    className="control-surface flex size-11 items-center justify-center rounded-full text-primary shadow-[0_0_24px_var(--surface-glow)]"
                  >
                    <Command className="size-4" />
                  </Link>
                  <div className="min-w-0">
                    <p className="font-display text-xl tracking-tight text-foreground">Личный профиль</p>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Analytical Zen
                    </p>
                  </div>
                </div>

                <nav className="hidden items-center gap-2 lg:flex">
                  {navItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "rounded-full px-4 py-2 text-[13px] font-medium tracking-wide transition-all duration-300",
                        item.active
                          ? "border border-primary/25 bg-primary/12 text-foreground shadow-[0_12px_28px_var(--surface-glow)]"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex items-center gap-2">
                  <Link
                    href="/compare"
                    className="control-surface flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Открыть сравнение"
                  >
                    <Search className="size-4" />
                  </Link>
                  <ProfileSwitcher />
                  <ThemeToggle />
                  <div className="control-surface hidden items-center gap-2 rounded-full px-2.5 py-1.5 lg:flex">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[color:var(--surface-inset-strong)] text-xs font-semibold text-foreground">
                      {currentProfile ? getInitials(currentProfile.profileMeta.displayName) : "LP"}
                    </div>
                    <div className="max-w-[120px]">
                      <p className="truncate text-sm font-medium text-foreground">
                        {currentProfile?.profileMeta.displayName ?? "Локальный профиль"}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        profile
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => (
                  <Link
                    key={`${item.key}-mobile`}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-[13px] font-medium tracking-wide transition-all duration-300",
                      item.active
                        ? "border border-primary/25 bg-primary/12 text-foreground shadow-[0_12px_28px_var(--surface-glow)]"
                        : "border border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={cn(
          "relative flex min-h-screen flex-col",
          !isTestRunner && "mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}
