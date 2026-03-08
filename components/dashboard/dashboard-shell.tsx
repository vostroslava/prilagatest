import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopNav } from "@/components/dashboard/dashboard-top-nav";

interface DashboardShellProps {
  displayName: string;
  currentProfileId: string | null;
  overallProgress: number;
  children: React.ReactNode;
}

export function DashboardShell({
  displayName,
  currentProfileId,
  overallProgress,
  children,
}: DashboardShellProps) {
  return (
    <div className="dark dashboard-page-bg min-h-screen px-6 py-6 lg:px-8">
      <div className="dashboard-frame mx-auto max-w-[1460px] overflow-hidden rounded-[2.4rem]">
        <DashboardTopNav
          displayName={displayName}
          currentProfileId={currentProfileId}
        />

        <div className="grid gap-6 p-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <DashboardSidebar
            currentProfileId={currentProfileId}
            overallProgress={overallProgress}
          />

          <div className="min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
