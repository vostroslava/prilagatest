interface AnalysisListSectionProps {
  title: string;
  items: string[];
  tone?: "default" | "accent" | "warning";
}

const TONE_CLASS: Record<NonNullable<AnalysisListSectionProps["tone"]>, string> = {
  default: "text-foreground",
  accent: "text-cyan-300",
  warning: "text-orange-300",
};

export function AnalysisListSection({
  title,
  items,
  tone = "default",
}: AnalysisListSectionProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="dashboard-card rounded-[1.8rem] p-5">
      <p className={`section-kicker ${TONE_CLASS[tone]}`}>
        {title}
      </p>
      <div className="glow-divider mt-4" />
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="quiet-panel rounded-[1.35rem] p-4 text-sm leading-7 text-muted-foreground">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
