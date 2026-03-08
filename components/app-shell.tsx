"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, Command, LogOut, Search } from "lucide-react";

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
  const { currentProfileId, currentProfile, account, authStatus } = useProfiles();

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
          <div className="mx-auto max-w-[1380px]">
            <div className="dashboard-shell rounded-[2rem] px-4 py-3.5 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Link
                    href="/"
                    className="shell-control shell-control-icon glow-pill text-primary"
                  >
                    <Command className="size-4" />
                  </Link>
                  <div className="min-w-0">
                    <p className="font-display text-xl tracking-tight text-foreground">
                      Личный профиль
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Профиль · Тесты · Самопонимание
                    </p>
                  </div>
                </div>

                <nav className="hidden items-center gap-1.5 lg:flex">
                  {navItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="shell-control shell-tab"
                      aria-current={item.active ? "page" : undefined}
                      data-active={item.active ? "true" : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex items-center gap-2">
                  <Link
                    href="/compare"
                    className="shell-control shell-control-icon text-muted-foreground hover:text-foreground"
                    aria-label="Открыть сравнение"
                  >
                    <Search className="size-4" />
                  </Link>
                  <button
                    type="button"
                    className="shell-control shell-control-icon hidden text-muted-foreground hover:text-foreground lg:flex"
                    aria-label="Уведомления"
                  >
                    <Bell className="size-4" />
                  </button>
                  <ProfileSwitcher />
                  <ThemeToggle />
                  <div className="shell-control hidden min-w-[196px] justify-start gap-2 pl-2 pr-3 lg:flex">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--surface-quiet-strong)] text-xs font-semibold text-foreground shadow-[0_0_18px_var(--surface-glow)]">
                      {account
                        ? getInitials(account.displayName)
                        : currentProfile
                          ? getInitials(currentProfile.profileMeta.displayName)
                          : "LP"}
                    </div>
                    <div className="max-w-[120px]">
                      <p className="truncate text-sm font-medium text-foreground">
                        {account?.displayName ?? currentProfile?.profileMeta.displayName ?? "Локальный профиль"}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {account ? `@${account.username}` : "guest mode"}
                      </p>
                    </div>
                  </div>
                  {authStatus === "authenticated" ? (
                    <button
                      type="button"
                      className="shell-control shell-control-icon hidden text-muted-foreground hover:text-foreground lg:flex"
                      aria-label="Выйти из аккаунта"
                      onClick={() => void signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="size-4" />
                    </button>
                  ) : (
                    <Link
                      href="/auth"
                      className="shell-control shell-tab hidden text-foreground lg:inline-flex"
                    >
                      Войти
                    </Link>
                  )}
                </div>
              </div>

              <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => (
                  <Link
                    key={`${item.key}-mobile`}
                    href={item.href}
                    className="shell-control shell-tab h-9 shrink-0 px-4"
                    aria-current={item.active ? "page" : undefined}
                    data-active={item.active ? "true" : undefined}
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
          !isTestRunner && "mx-auto w-full max-w-[1380px] px-4 pb-14 pt-[7.75rem] sm:px-6 lg:px-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}
