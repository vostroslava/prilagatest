"use client";

import * as React from "react";

import {
  DASHBOARD_TEST_BLOCK_PRESETS,
} from "@/components/dashboard/config";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TestBlocks } from "@/components/dashboard/test-blocks";
import { useProfiles } from "@/components/providers/profiles-provider";
import { TEST_BLOCKS } from "@/content/tests";

export function HomeDashboard() {
  const { profiles, currentProfile, account } = useProfiles();

  const focusProfile = currentProfile ?? profiles[0] ?? null;
  const displayName =
    focusProfile?.profileMeta.displayName ?? account?.displayName ?? "Алексей";

  const overallProgress = React.useMemo(() => {
    if (!focusProfile) {
      return 32;
    }

    const answered = Object.values(focusProfile.assessmentProgress).reduce(
      (sum, block) => sum + block.answered,
      0,
    );
    const total = Object.values(focusProfile.assessmentProgress).reduce(
      (sum, block) => sum + block.total,
      0,
    );

    return total ? Math.round((answered / total) * 100) : 32;
  }, [focusProfile]);

  const testBlockItems = React.useMemo(
    () =>
      DASHBOARD_TEST_BLOCK_PRESETS.map((preset) => {
        const blockConfig = TEST_BLOCKS.find((block) => block.id === preset.id);
        const progress = focusProfile?.assessmentProgress[preset.id as keyof typeof focusProfile.assessmentProgress];

        return {
          ...preset,
          subtitle: blockConfig ? `${blockConfig.questions.length} вопросов` : preset.subtitle,
          progress: progress ? Math.round(progress.completionRatio * 100) : preset.fallbackProgress,
          href: focusProfile ? `/profiles/${focusProfile.profileMeta.id}/tests` : "/profiles/new",
        };
      }),
    [focusProfile],
  );

  return (
    <DashboardShell
      currentProfileId={focusProfile?.profileMeta.id ?? null}
      displayName={displayName}
      overallProgress={overallProgress}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21.5rem]">
        <div className="space-y-6">
          <HeroBanner
            displayName={displayName}
            continueHref={focusProfile ? `/profiles/${focusProfile.profileMeta.id}/tests` : "/profiles/new"}
          />
          <div className="dashboard-card rounded-[2rem] p-6 text-white/70">
            Profile widget slot
          </div>
          <div className="dashboard-card rounded-[2rem] p-6 text-white/70">
            Journey timeline slot
          </div>
        </div>

        <div className="space-y-6">
          <TestBlocks items={testBlockItems} />
          <div className="dashboard-card rounded-[2rem] p-6 text-white/70">
            Quick actions slot
          </div>
          <div className="dashboard-card rounded-[2rem] p-6 text-white/70">
            Recent comparisons slot
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
