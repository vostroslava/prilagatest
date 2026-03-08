"use client";

import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";

import { DASHBOARD_TOP_ACTIONS, DASHBOARD_TOP_NAV } from "@/components/dashboard/config";
import { cn } from "@/lib/utils";

interface DashboardTopNavProps {
  displayName: string;
  activeKey?: string;
  currentProfileId: string | null;
}

function buildHref(key: string, currentProfileId: string | null) {
  switch (key) {
    case "tests":
      return currentProfileId ? `/profiles/${currentProfileId}/tests` : "/profiles/new";
    case "profile":
      return currentProfileId ? `/profiles/${currentProfileId}/results` : "/profiles/new";
    case "compare":
      return "/compare";
    case "export":
      return currentProfileId ? `/profiles/${currentProfileId}/raw-data` : "/profiles/new";
    default:
      return "/";
  }
}

function ActionButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="dashboard-shell-button flex size-10 items-center justify-center rounded-full"
    >
      <Icon className="size-4" />
    </button>
  );
}

export function DashboardTopNav({
  displayName,
  activeKey = "home",
  currentProfileId,
}: DashboardTopNavProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-[color:var(--dashboard-border)] px-6 py-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="dashboard-brand-mark flex size-12 items-center justify-center rounded-2xl">
          <div className="grid size-6 grid-cols-2 gap-1">
            <span className="rounded-sm bg-cyan-300/80 shadow-[0_0_12px_rgba(45,211,191,0.9)]" />
            <span className="rounded-sm bg-cyan-300/60" />
            <span className="rounded-sm bg-cyan-300/60" />
            <span className="rounded-sm bg-cyan-200/90 shadow-[0_0_12px_rgba(45,211,191,0.6)]" />
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-display text-[0.92rem] uppercase tracking-[0.42em] text-foreground">
            Analytical Zen
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/42">
            Профиль · Тесты · Самопонимание
          </p>
        </div>
      </div>

      <nav className="hidden items-center gap-2 lg:flex">
        {DASHBOARD_TOP_NAV.map((item) => {
          const active = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={buildHref(item.key, currentProfileId)}
              className={cn(
                "dashboard-shell-button flex h-10 items-center rounded-full px-5 text-[13px] font-medium text-white/72",
                active && "dashboard-shell-button-active text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        {DASHBOARD_TOP_ACTIONS.map((Icon, index) => (
          <ActionButton
            key={Icon.displayName ?? Icon.name}
            icon={Icon}
            label={`Dashboard action ${index + 1}`}
          />
        ))}

        <button
          type="button"
          className="dashboard-shell-button flex h-10 min-w-[9rem] items-center justify-between rounded-full pl-2 pr-3"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe9d2,#9d6544_58%,#3a2319)] ring-1 ring-white/12" />
            <span className="truncate text-sm font-medium text-white">{displayName}</span>
          </div>
          <ChevronDown className="size-4 text-white/55" />
        </button>
      </div>
    </div>
  );
}
