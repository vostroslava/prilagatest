"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/components/providers/profiles-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentProfileId } = useProfiles();

  const navItems = [
    { href: "/", label: "Профили" },
    ...(currentProfileId ? [
      { href: `/profiles/${currentProfileId}/tests`, label: "Тесты" },
      { href: `/profiles/${currentProfileId}/results`, label: "Аналитика" },
    ] : []),
    { href: "/compare", label: "Сравнение" },
  ];

  const isTestRunner = pathname.includes("/tests") && currentProfileId;

  return (
    <div className="relative min-h-screen flex flex-col">
      {!isTestRunner && (
        <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl shadow-2xl">
            <Link href="/" className="flex items-center justify-center size-9 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors ml-1">
              <Activity className="size-4" />
            </Link>
            
            <nav className="flex items-center px-2 gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300",
                      active 
                        ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="w-px h-5 bg-white/10 mx-1" />
            
            <div className="flex items-center gap-1 pr-1">
               <ProfileSwitcher />
               <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1 flex flex-col", !isTestRunner && "pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full")}>
        {children}
      </main>
    </div>
  );
}
