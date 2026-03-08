import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProfileRadar } from "@/components/visuals/profile-radar";

interface DashboardScaleMetric {
  key: string;
  label: string;
  value: number;
}

interface ProfileRadarWidgetProps {
  title: string;
  radarData: Array<{ label: string; value: number }>;
  metrics: DashboardScaleMetric[];
  profileHref: string;
}

function getMetricTrackStyle(key: string) {
  if (key === "neuroticism") {
    return {
      background:
        "linear-gradient(90deg, rgba(255,122,144,0.95), rgba(255,170,188,0.62) 72%, rgba(255,255,255,0.08) 100%)",
      boxShadow: "0 0 16px rgba(255,122,144,0.28)",
    };
  }

  return {
    background:
      "linear-gradient(90deg, rgba(82,245,225,0.95), rgba(58,208,216,0.76) 72%, rgba(255,255,255,0.08) 100%)",
    boxShadow: "0 0 16px rgba(45,211,191,0.28)",
  };
}

export function ProfileRadarWidget({
  title,
  radarData,
  metrics,
  profileHref,
}: ProfileRadarWidgetProps) {
  return (
    <section className="dashboard-card rounded-[2rem] px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Мой профиль</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h2>
        </div>
        <div className="dashboard-shell-button flex size-9 items-center justify-center rounded-full text-white/55">
          <ArrowRight className="size-4" />
        </div>
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-[0.82fr_1fr]">
        <div className="flex flex-col">
          <ProfileRadar
            data={radarData}
            height={312}
            className="border-none bg-transparent shadow-none"
            primaryStroke="#00E5FF"
            showLabels
          />

          <Link
            href={profileHref}
            className="dashboard-outline-button mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-white"
          >
            Смотреть профиль
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex flex-col justify-center gap-5">
          {metrics.map((metric) => (
            <div key={metric.key}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-medium text-white/82">{metric.label}</span>
                <span className="text-base font-semibold text-cyan-300">{metric.value}%</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${metric.value}%`,
                    ...getMetricTrackStyle(metric.key),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
