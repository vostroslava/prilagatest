import Link from "next/link";

import type { DashboardQuickActionPreset } from "@/components/dashboard/config";
import { cn } from "@/lib/utils";

interface QuickActionItem extends DashboardQuickActionPreset {
  href: string;
  active?: boolean;
}

interface QuickActionsProps {
  items: QuickActionItem[];
}

function ActionRow({
  href,
  label,
  icon: Icon,
  active = false,
}: QuickActionItem) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[4.2rem] items-center overflow-hidden rounded-[1.3rem] px-5 text-sm text-white/82 transition-all duration-200 hover:-translate-y-0.5",
        active
          ? "border border-cyan-300/25 bg-[linear-gradient(90deg,rgba(45,211,191,0.2),rgba(255,255,255,0.04))] shadow-[0_0_24px_rgba(45,211,191,0.14)]"
          : "dashboard-card-soft border border-white/10",
      )}
    >
      {active ? (
        <span className="absolute inset-y-0 right-0 w-28 bg-[radial-gradient(circle_at_right,rgba(45,211,191,0.28),transparent_70%)]" />
      ) : null}

      <span className="relative text-base font-medium">{label}</span>
      <Icon className="relative ml-auto size-4 text-cyan-200/90 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function QuickActions({ items }: QuickActionsProps) {
  return (
    <section className="dashboard-card rounded-[2rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Быстрые действия</h2>
        <span className="h-px w-12 bg-[linear-gradient(90deg,transparent,#1dd7c6,transparent)]" />
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <ActionRow
            key={item.key}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.active}
          />
        ))}
      </div>
    </section>
  );
}
