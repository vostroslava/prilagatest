"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DASHBOARD_SIDEBAR_NAV } from "@/components/dashboard/config";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeKey?: string;
  currentProfileId: string | null;
  overallProgress: number;
}

function buildHref(key: string, currentProfileId: string | null) {
  switch (key) {
    case "tests":
      return currentProfileId ? `/profiles/${currentProfileId}/tests` : "/profiles/new";
    case "profile":
    case "analytics":
      return currentProfileId ? `/profiles/${currentProfileId}/results` : "/profiles/new";
    case "compare":
      return "/compare";
    case "export":
      return currentProfileId ? `/profiles/${currentProfileId}/raw-data` : "/profiles/new";
    default:
      return "/";
  }
}

export function DashboardSidebar({
  activeKey = "home",
  currentProfileId,
  overallProgress,
}: DashboardSidebarProps) {
  const clampedProgress = Math.max(0, Math.min(overallProgress, 100));

  return (
    <aside className="flex min-h-[44rem] flex-col gap-5">
      <div className="dashboard-card flex-1 rounded-[2rem] p-4">
        <nav className="space-y-2">
          {DASHBOARD_SIDEBAR_NAV.map((item) => {
            const active = item.key === activeKey;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={buildHref(item.key, currentProfileId)}
                className={cn(
                  "group flex h-14 items-center gap-4 rounded-[1.25rem] px-4 text-sm font-medium text-white/68 transition-all",
                  active
                    ? "dashboard-sidebar-item-active text-white"
                    : "hover:bg-white/5 hover:text-white",
                )}
              >
                {Icon ? <Icon className="size-5 text-cyan-200/80 group-hover:text-cyan-100" /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="dashboard-card rounded-[2rem] p-5">
        <p className="text-xl font-semibold tracking-tight text-white">Прогресс</p>

        <div className="mt-5 flex justify-center">
          <div className="relative flex size-28 items-center justify-center rounded-full border border-[color:var(--dashboard-border)] bg-[rgba(6,11,17,0.96)] shadow-[0_0_22px_rgba(45,211,191,0.08)]">
            <div
              className="absolute inset-[0.45rem] rounded-full"
              style={{
                background: `conic-gradient(#19d4c4 0deg, #19d4c4 ${clampedProgress * 3.6}deg, rgba(255,255,255,0.08) ${clampedProgress * 3.6}deg, rgba(255,255,255,0.08) 360deg)`,
              }}
            />
            <div className="absolute inset-[0.85rem] rounded-full bg-[rgba(6,11,17,0.98)] ring-1 ring-white/8" />
            <div className="relative text-center">
              <div className="text-3xl font-semibold tracking-tight text-white">{clampedProgress}%</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40">
                готового пути
              </div>
            </div>
          </div>
        </div>

        <Link
          href={currentProfileId ? `/profiles/${currentProfileId}/tests` : "/profiles/new"}
          className="dashboard-primary-button mt-6 flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium text-white"
        >
          Продолжить
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </aside>
  );
}
