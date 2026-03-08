import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { DashboardComparisonPreset } from "@/components/dashboard/config";

interface RecentComparisonsProps {
  items: DashboardComparisonPreset[];
}

export function RecentComparisons({ items }: RecentComparisonsProps) {
  return (
    <section className="dashboard-card rounded-[2rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Последние сравнения
        </h2>
        <span className="h-px w-12 bg-[linear-gradient(90deg,transparent,#1dd7c6,transparent)]" />
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href="/compare"
            className="dashboard-card-soft flex items-center gap-3 rounded-[1.35rem] px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex -space-x-3">
              <span
                className={`size-10 rounded-full bg-gradient-to-br ${item.leftTone} ring-2 ring-[color:var(--dashboard-surface-strong)]`}
              />
              <span
                className={`size-10 rounded-full bg-gradient-to-br ${item.rightTone} ring-2 ring-[color:var(--dashboard-surface-strong)]`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{item.leftName}</span>
                {item.connected ? (
                  <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(45,211,191,0.8)]" />
                ) : null}
                <span className="truncate text-sm text-white/74">{item.rightName}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] tracking-[0.02em] text-white/40">
              <span>{item.dateLabel}</span>
              <ChevronRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/compare"
        className="dashboard-outline-button mt-5 flex h-12 items-center justify-center rounded-full text-sm font-medium text-white"
      >
        Все сравнения
      </Link>
    </section>
  );
}
