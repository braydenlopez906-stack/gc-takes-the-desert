const WORDS = ["COACHELLA 2027", "GC TAKES THE DESERT", "INDIO OR BUST", "LOCK IN", "SUNSCREEN IS NOT OPTIONAL", "MEET AT THE FERRIS WHEEL", "NO FLAKES", "HYDRATE", "WEEKEND WAR IS LIVE"];

export default function Ticker() {
  const items = [...WORDS, ...WORDS];
  return (
    <div className="bg-ink text-tape border-b-[3px] border-pink overflow-hidden py-2 pixel text-[11px] sm:text-xs" aria-hidden="true">
      <div className="flex w-max gap-10 marquee pl-10">
        {items.map((w, i) => (
          <span key={i} className="inline-flex items-center gap-10"><span className="text-pink">✦</span>{w}</span>
        ))}
      </div>
    </div>
  );
}
