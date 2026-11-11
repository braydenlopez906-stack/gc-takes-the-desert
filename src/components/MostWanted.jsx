import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown } from "lucide-react";
import { useTrip } from "../lib/trip";
import { Hand, RollingNumber, SectionHead, Script } from "./ui";

/* Chart page from a music magazine: the group's artist picks, merged and ranked. */
export default function MostWanted() {
  const { lineup, status } = useTrip();
  const reduce = useReducedMotion();
  const [top, ...rest] = lineup;
  const totalPicks = lineup.reduce((n, g) => n + g.votes, 0);

  return (
    <section id="most-wanted" aria-labelledby="mw-title" className="relative bg-paper border-t-[3px] border-ink py-20 sm:py-28 overflow-hidden">
      <div className="gutter relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead id="mw-title" kicker={`The GC chart · ${totalPicks} pick${totalPicks === 1 ? "" : "s"} counted`} lines={["GC MOST", <>WANTED <Script className="text-cobalt">list</Script></>]} />
          <Hand className="text-cobalt text-2xl max-w-[22ch]">same artist typed two ways? merged automatically.</Hand>
        </div>

        {!top ? (
          <div className="mt-12 border-[3px] border-dashed border-ink/40 p-8 text-center">
            <p className="poster text-[64px] text-ink/20">TBA</p>
            <p className="font-hand text-2xl mt-2">{status === "ready" ? "No picks yet. Every artist on the roster lands here, most votes on top." : "Loading the chart…"}</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start">
            {/* NUMBER ONE */}
            <motion.article
              key={top.key}
              initial={reduce ? false : { scale: 0.9, rotate: -5 }}
              whileInView={{ scale: 1, rotate: -1.5 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="relative bg-ink text-paper border-[3px] border-ink shadow-[12px_12px_0_#ff6a1a] p-6 pt-8 sm:p-9 overflow-hidden"
            >
              <div className="absolute inset-y-0 right-0 w-1/2 halftone opacity-[.18] invert pointer-events-none" aria-hidden="true" />
              <div className="flex items-center justify-between pixel text-[11px] text-tape">
                <span className="inline-flex items-center gap-1.5"><Crown className="w-4 h-4" aria-hidden="true" /> NUMBER ONE WITH A BULLET</span>
                <span>WK 01</span>
              </div>
              <p className="poster text-pink text-[clamp(110px,34vw,220px)] leading-[.75] mt-4 [-webkit-text-stroke:2px_#fbf1df]" aria-hidden="true">#1</p>
              <h3 className="poster text-[clamp(52px,15vw,120px)] mt-3 [overflow-wrap:anywhere] text-balance">{top.name}</h3>
              <p className="mt-4 poster-wide text-2xl text-tape">
                <RollingNumber value={top.votes} /> {top.votes === 1 ? "VOTE" : "VOTES"}
              </p>
              <p className="font-hand text-xl text-paper/80 mt-1">picked by {top.who.join(", ")}</p>
              <div className="absolute -right-3 -top-3 w-[104px] aspect-square rounded-full bg-tape text-ink grid place-items-center rotate-12 border-[3px] border-ink spin-slow" aria-hidden="true">
                <span className="poster-wide text-sm text-center leading-[.95]">MOST<br />HYPED</span>
              </div>
            </motion.article>

            {/* THE REST */}
            <ol className="flex flex-col" aria-label="The rest of the chart">
              <AnimatePresence initial={false}>
                {rest.map((g, i) => (
                  <motion.li
                    key={g.key}
                    layout={!reduce}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="group grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3 border-b-2 border-ink/80"
                  >
                    <span className="pixel text-lg text-pink">{String(i + 2).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className={`block poster-wide [overflow-wrap:anywhere] group-hover:text-cobalt transition-colors ${i < 3 ? "text-[28px] sm:text-[34px]" : "text-[21px]"}`}>{g.name}</span>
                      <span className="block font-hand text-base text-dusk truncate">{g.who.join(", ")}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Tally n={g.votes} />
                      <span className="poster-wide text-2xl tabular-nums">— {g.votes}</span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {rest.length === 0 && <li className="font-hand text-2xl text-dusk py-4">Only one artist so far. Add a different pick and start a rivalry.</li>}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

/* Tally marks: |||| with a slash every five */
function Tally({ n }) {
  const shown = Math.min(n, 10);
  const groups = [];
  for (let i = 0; i < shown; i += 5) groups.push(Math.min(5, shown - i));
  return (
    <svg width={groups.length * 30} height="24" viewBox={`0 0 ${groups.length * 30} 24`} aria-hidden="true" className="hidden min-[400px]:block">
      {groups.map((c, gi) => (
        <g key={gi} transform={`translate(${gi * 30} 0)`} stroke="#22122e" strokeWidth="2.5" strokeLinecap="round">
          {Array.from({ length: Math.min(c, 4) }, (_, k) => <line key={k} x1={4 + k * 5} y1="3" x2={3 + k * 5} y2="21" />)}
          {c === 5 && <line x1="0" y1="18" x2="24" y2="6" stroke="#ff3a87" />}
        </g>
      ))}
    </svg>
  );
}
