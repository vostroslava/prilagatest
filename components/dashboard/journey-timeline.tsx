import { DASHBOARD_JOURNEY_STEPS } from "@/components/dashboard/config";
import { cn } from "@/lib/utils";

interface JourneyTimelineProps {
  activeKey: string;
  completedKeys: string[];
}

export function JourneyTimeline({
  activeKey,
  completedKeys,
}: JourneyTimelineProps) {
  return (
    <section className="dashboard-card rounded-[2rem] px-7 py-6">
      <h2 className="text-2xl font-semibold tracking-tight text-white">Ваш прогресс</h2>

      <div className="mt-8 grid grid-cols-5 items-start">
        {DASHBOARD_JOURNEY_STEPS.map((step, index) => {
          const completed = completedKeys.includes(step.key);
          const active = activeKey === step.key;
          const upcoming = !completed && !active;

          return (
            <div key={step.key} className="relative flex flex-col items-center text-center">
              {index < DASHBOARD_JOURNEY_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-1/2 top-4 h-px w-full -translate-y-1/2",
                    completed || active
                      ? "bg-[linear-gradient(90deg,rgba(37,223,206,0.86),rgba(37,223,206,0.32))]"
                      : "bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]",
                  )}
                />
              ) : null}

              <div
                className={cn(
                  "relative z-10 flex items-center justify-center rounded-full border",
                  active && "size-9 border-cyan-200/70 bg-[rgba(14,40,48,0.95)] shadow-[0_0_24px_rgba(45,211,191,0.55)]",
                  completed && !active && "size-6 border-cyan-300/55 bg-cyan-300/90 shadow-[0_0_18px_rgba(45,211,191,0.45)]",
                  upcoming && "size-6 border-white/18 bg-[rgba(255,255,255,0.05)]",
                )}
              >
                {active ? (
                  <>
                    <span className="absolute inset-[-6px] rounded-full border border-cyan-300/38" />
                    <span className="size-3 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(45,211,191,1)]" />
                  </>
                ) : null}
              </div>

              <p
                className={cn(
                  "mt-5 whitespace-pre-line text-sm leading-5",
                  active ? "font-semibold text-white" : "text-white/58",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
