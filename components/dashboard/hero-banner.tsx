import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HeroBannerArt } from "@/components/dashboard/hero-banner-art";

interface HeroBannerProps {
  displayName: string;
  continueHref: string;
  onLoadDemoProfiles?: () => void;
  loadingDemoProfiles?: boolean;
}

export function HeroBanner({
  displayName,
  continueHref,
  onLoadDemoProfiles,
  loadingDemoProfiles = false,
}: HeroBannerProps) {
  return (
    <section className="dashboard-card relative min-h-[12.6rem] rounded-[2rem] px-8 py-7">
      <div className="relative z-10 max-w-[23rem]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/64">
          Главная
        </p>
        <h1 className="mt-5 font-display text-[2.55rem] leading-[1.02] tracking-tight text-white">
          Добро пожаловать, {displayName}
        </h1>
        <p className="mt-3 text-lg leading-8 text-white/54">
          Готов исследовать свой живой профиль?
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={continueHref}
            className="dashboard-primary-button inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium text-white"
          >
            Продолжить тесты
            <ArrowRight className="size-4" />
          </Link>

          {onLoadDemoProfiles ? (
            <button
              type="button"
              className="dashboard-outline-button inline-flex h-12 items-center rounded-full px-6 text-sm font-medium text-white/88"
              disabled={loadingDemoProfiles}
              onClick={onLoadDemoProfiles}
            >
              {loadingDemoProfiles ? "Загрузка..." : "Загрузить демо-профили"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 w-[52%] bg-[linear-gradient(90deg,transparent_0%,rgba(6,11,17,0.08)_12%,rgba(6,11,17,0.72)_100%)]" />
      <HeroBannerArt />
    </section>
  );
}
