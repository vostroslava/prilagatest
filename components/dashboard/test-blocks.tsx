import Link from "next/link";

import { DashboardProgressRing } from "@/components/dashboard/dashboard-progress-ring";
import type { DashboardTestBlockPreset } from "@/components/dashboard/config";

interface TestBlockItem extends DashboardTestBlockPreset {
  href: string;
  progress: number;
}

interface TestBlocksProps {
  items: TestBlockItem[];
}

function getAccentClasses(accent: TestBlockItem["accent"]) {
  switch (accent) {
    case "orange":
      return {
        icon: "from-orange-400/30 to-amber-500/12 text-orange-200 shadow-[0_0_24px_rgba(251,146,60,0.24)]",
      };
    case "teal":
      return {
        icon: "from-emerald-400/24 to-cyan-500/12 text-cyan-100 shadow-[0_0_24px_rgba(45,211,191,0.22)]",
      };
    default:
      return {
        icon: "from-cyan-300/26 to-sky-500/12 text-cyan-100 shadow-[0_0_24px_rgba(45,211,191,0.22)]",
      };
  }
}

export function TestBlocks({ items }: TestBlocksProps) {
  return (
    <section className="dashboard-card flex h-full min-h-[12.6rem] flex-col rounded-[2rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Тестовые блоки</h2>
        <span className="h-px w-12 bg-[linear-gradient(90deg,transparent,#1dd7c6,transparent)]" />
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const accent = getAccentClasses(item.accent);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="dashboard-card-soft flex items-center gap-4 rounded-[1.45rem] px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${accent.icon}`}
              >
                <Icon className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-medium tracking-tight text-white">{item.title}</p>
                <p className="mt-1 text-sm text-white/42">{item.subtitle}</p>
              </div>

              <DashboardProgressRing value={item.progress} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
