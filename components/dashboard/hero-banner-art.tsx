const STAR_POSITIONS = [
  { left: "8%", top: "18%", size: "0.32rem" },
  { left: "18%", top: "62%", size: "0.24rem" },
  { left: "27%", top: "34%", size: "0.22rem" },
  { left: "38%", top: "16%", size: "0.28rem" },
  { left: "45%", top: "74%", size: "0.18rem" },
  { left: "56%", top: "24%", size: "0.3rem" },
  { left: "62%", top: "58%", size: "0.22rem" },
  { left: "74%", top: "14%", size: "0.24rem" },
  { left: "84%", top: "36%", size: "0.28rem" },
  { left: "88%", top: "70%", size: "0.34rem" },
];

export function HeroBannerArt() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_42%,rgba(37,225,210,0.38),transparent_18%),radial-gradient(circle_at_72%_40%,rgba(45,211,191,0.14),transparent_32%),radial-gradient(circle_at_82%_48%,rgba(59,130,246,0.12),transparent_34%)]" />

      <div className="absolute right-[8%] top-[12%] h-[74%] w-[46%] rounded-[48%] bg-[radial-gradient(circle_at_48%_26%,rgba(120,255,246,0.42),transparent_18%),radial-gradient(circle_at_50%_42%,rgba(61,228,213,0.26),transparent_38%),radial-gradient(circle_at_50%_58%,rgba(17,110,108,0.16),transparent_72%)] blur-[2px]" />

      <div className="absolute right-[17%] top-[18%] h-[34%] w-[20%] rounded-full border border-cyan-300/18 bg-[radial-gradient(circle_at_50%_34%,rgba(136,255,247,0.52),rgba(17,52,57,0.2)_58%,transparent_74%)] shadow-[0_0_40px_rgba(45,211,191,0.28)]" />
      <div className="absolute right-[11%] top-[45%] h-[34%] w-[34%] rounded-[46%] border border-cyan-300/10 bg-[radial-gradient(circle_at_50%_28%,rgba(79,243,221,0.28),transparent_38%),linear-gradient(180deg,rgba(30,110,104,0.18),rgba(6,16,26,0.02))] blur-[0.4px]" />

      <div className="absolute right-[11%] top-[18%] h-[58%] w-[38%]">
        <div className="absolute left-[18%] top-[8%] h-[76%] w-[58%] rounded-[48%] border border-cyan-300/12" />
        <div className="absolute left-[8%] top-[18%] h-[58%] w-[68%] rounded-[46%] border border-cyan-300/10" />
        <div className="absolute left-[28%] top-[12%] h-[70%] w-[52%] rounded-[48%] border border-cyan-300/8" />
        <div className="absolute left-[22%] top-[24%] h-[1px] w-[62%] bg-cyan-300/28 shadow-[0_0_12px_rgba(45,211,191,0.7)]" />
        <div className="absolute left-[12%] top-[42%] h-[1px] w-[76%] bg-cyan-300/18" />
        <div className="absolute left-[18%] top-[58%] h-[1px] w-[66%] bg-cyan-300/18" />
        <div className="absolute left-[44%] top-[14%] h-[68%] w-[1px] bg-cyan-300/20" />
        <div className="absolute left-[24%] top-[26%] h-[46%] w-[1px] rotate-[-20deg] bg-cyan-300/16" />
        <div className="absolute left-[58%] top-[24%] h-[46%] w-[1px] rotate-[22deg] bg-cyan-300/16" />
      </div>

      {STAR_POSITIONS.map((star) => (
        <span
          key={`${star.left}-${star.top}`}
          className="absolute rounded-full bg-cyan-200/90 shadow-[0_0_14px_rgba(45,211,191,0.72)]"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
        />
      ))}
    </div>
  );
}
