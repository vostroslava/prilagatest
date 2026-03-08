const STAR_POINTS = [
  { left: "14%", top: "16%", size: "0.22rem" },
  { left: "22%", top: "56%", size: "0.18rem" },
  { left: "28%", top: "30%", size: "0.16rem" },
  { left: "36%", top: "10%", size: "0.2rem" },
  { left: "48%", top: "72%", size: "0.16rem" },
  { left: "62%", top: "22%", size: "0.2rem" },
  { left: "72%", top: "42%", size: "0.18rem" },
  { left: "82%", top: "14%", size: "0.16rem" },
  { left: "88%", top: "64%", size: "0.22rem" },
];

const HEAD_NODES = [
  { left: "56%", top: "16%" },
  { left: "65%", top: "18%" },
  { left: "72%", top: "23%" },
  { left: "77%", top: "31%" },
  { left: "79%", top: "40%" },
  { left: "76%", top: "49%" },
  { left: "70%", top: "58%" },
  { left: "62%", top: "66%" },
  { left: "55%", top: "60%" },
  { left: "52%", top: "49%" },
  { left: "53%", top: "38%" },
  { left: "58%", top: "28%" },
  { left: "64%", top: "38%" },
  { left: "66%", top: "49%" },
];

const HEAD_LINES = [
  { left: "55%", top: "17%", width: "11%", rotate: "16deg" },
  { left: "63%", top: "20%", width: "11%", rotate: "30deg" },
  { left: "69%", top: "27%", width: "10%", rotate: "46deg" },
  { left: "71%", top: "37%", width: "9%", rotate: "86deg" },
  { left: "68%", top: "50%", width: "10%", rotate: "128deg" },
  { left: "60%", top: "60%", width: "11%", rotate: "144deg" },
  { left: "54%", top: "52%", width: "10%", rotate: "104deg" },
  { left: "53%", top: "40%", width: "9%", rotate: "84deg" },
  { left: "55%", top: "27%", width: "10%", rotate: "54deg" },
  { left: "56%", top: "32%", width: "18%", rotate: "18deg" },
  { left: "55%", top: "44%", width: "20%", rotate: "4deg" },
  { left: "54%", top: "56%", width: "16%", rotate: "-18deg" },
  { left: "48%", top: "32%", width: "20%", rotate: "16deg" },
  { left: "46%", top: "49%", width: "18%", rotate: "-4deg" },
];

export function HeroBannerArt() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(0,229,255,0.22),transparent_18%),radial-gradient(circle_at_78%_46%,rgba(45,211,191,0.16),transparent_30%),radial-gradient(circle_at_86%_52%,rgba(56,189,248,0.1),transparent_34%)]" />

      <div className="absolute right-[10%] top-[8%] h-[80%] w-[42%] rounded-[48%] bg-[radial-gradient(circle_at_46%_18%,rgba(130,255,248,0.24),transparent_12%),radial-gradient(circle_at_50%_36%,rgba(61,228,213,0.18),transparent_28%),radial-gradient(circle_at_50%_58%,rgba(18,93,104,0.22),transparent_54%),radial-gradient(circle_at_58%_60%,rgba(7,22,32,0.94),transparent_76%)] blur-[1.4px]" />

      <div className="absolute right-[17%] top-[8%] h-[76%] w-[28%] rounded-[44%_52%_46%_42%/24%_30%_56%_60%] border border-cyan-300/14 bg-[radial-gradient(circle_at_44%_22%,rgba(110,255,247,0.22),transparent_16%),linear-gradient(180deg,rgba(16,63,74,0.14),rgba(6,16,26,0.02))] shadow-[0_0_52px_rgba(45,211,191,0.12)]" />
      <div className="absolute right-[13%] top-[24%] h-[18%] w-[10%] rounded-[50%_40%_42%_58%/44%_54%_46%_56%] border border-cyan-300/10 bg-[radial-gradient(circle_at_40%_40%,rgba(123,255,248,0.12),transparent_32%)] blur-[0.2px]" />
      <div className="absolute right-[20%] bottom-[8%] h-[18%] w-[10%] rounded-[40%_38%_52%_48%/50%_46%_54%_52%] border border-cyan-300/8 bg-[linear-gradient(180deg,rgba(16,56,70,0.12),rgba(8,20,30,0.02))]" />

      <div className="absolute right-[20%] top-[16%] h-[60%] w-[30%]">
        {HEAD_LINES.map((line) => (
          <span
            key={`${line.left}-${line.top}-${line.rotate}`}
            className="absolute h-px rounded-full bg-cyan-300/30 shadow-[0_0_10px_rgba(45,211,191,0.4)]"
            style={{
              left: line.left,
              top: line.top,
              width: line.width,
              transform: `rotate(${line.rotate})`,
              transformOrigin: "left center",
            }}
          />
        ))}

        {HEAD_NODES.map((node, index) => (
          <span
            key={`${node.left}-${node.top}`}
            className="absolute rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(0,229,255,0.75)]"
            style={{
              left: node.left,
              top: node.top,
              width: index % 3 === 0 ? "0.3rem" : "0.22rem",
              height: index % 3 === 0 ? "0.3rem" : "0.22rem",
            }}
          />
        ))}

        <span className="absolute left-[49%] top-[29%] h-[1px] w-[22%] rotate-[10deg] bg-cyan-300/22" />
        <span className="absolute left-[50%] top-[49%] h-[1px] w-[24%] rotate-[-7deg] bg-cyan-300/22" />
        <span className="absolute left-[61%] top-[22%] h-[36%] w-px bg-cyan-300/18" />
      </div>

      <div className="absolute right-[26%] top-[30%] h-[16%] w-[9%] rounded-full border border-cyan-300/10 bg-[radial-gradient(circle_at_38%_42%,rgba(45,211,191,0.18),transparent_52%)] blur-[0.2px]" />

      {STAR_POINTS.map((star) => (
        <span
          key={`${star.left}-${star.top}`}
          className="absolute rounded-full bg-cyan-200/90 shadow-[0_0_8px_rgba(45,211,191,0.7)]"
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
