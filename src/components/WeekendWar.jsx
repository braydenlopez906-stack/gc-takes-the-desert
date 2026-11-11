import { useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Swords } from "lucide-react";
import { useTrip } from "../lib/trip";
import { errorMessage } from "../lib/errors";
import { WEEKENDS } from "../config";
import { Hand, RollingNumber, SectionHead, Script, confettiFrom, useToast } from "./ui";

const SEGMENTS = 20;
const SIDE = {
  1: { bg: "bg-pink", text: "text-paper", fill: "#ff3a87", corner: "PINK CORNER", shadow: "shadow-[8px_8px_0_#22122e]" },
  2: { bg: "bg-cobalt", text: "text-paper", fill: "#2a3cff", corner: "BLUE CORNER", shadow: "shadow-[8px_8px_0_#22122e]" },
};

/* Fight-night poster. One vote per pass; voting again switches sides. */
export default function WeekendWar() {
  const { me, tally, totalVotes, weekendLeader, voteWeekend, isConfigured } = useTrip();
  const toast = useToast();
  const shake = useAnimationControls();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [ko, setKo] = useState(null);
  const myVote = me?.weekend || null;

  async function vote(w, el) {
    if (!isConfigured) return toast("The database isn't connected yet.", "error");
    if (!me) {
      toast("Grab your pass first. Then pick your weekend.", "error");
      document.getElementById("join")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      return;
    }
    if (myVote === w || busy) return;
    setBusy(true);
    setKo(w);
    if (!reduce) shake.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.45 } });
    confettiFrom(el, 60);
    try {
      await voteWeekend(w);
      toast(myVote ? `Switched to ${WEEKENDS[w].label}.` : `Vote locked: ${WEEKENDS[w].label}.`, "pink");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
      setTimeout(() => setKo(null), 1400);
    }
  }

  const pct = (w) => (totalVotes ? Math.round((tally[w] / totalVotes) * 100) : 0);

  return (
    <section id="weekend" aria-labelledby="ww-title" className="relative bg-sand border-t-[3px] border-ink py-20 sm:py-28 overflow-hidden scroll-mt-4">
      <div className="gutter relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead id="ww-title" kicker="Main event · one vote per pass" lines={["THE", <>WEEKEND <Script className="text-pink">war</Script></>]} />
          <p className="pixel text-xs max-w-[34ch] leading-relaxed">
            {weekendLeader ? `${WEEKENDS[weekendLeader].label} is leading.` : totalVotes ? "Dead even. Somebody break the tie." : "No votes yet. Throw the first punch."} Tap your corner. You can switch sides later.
          </p>
        </div>

        <motion.div animate={shake} className="mt-10 relative bg-paper border-[3px] border-ink shadow-[12px_12px_0_#22122e] p-4 sm:p-8">
          <div className="flex justify-between pixel text-[10px] sm:text-xs border-b-2 border-ink pb-2.5">
            <span>INDIO, CA · EMPIRE POLO CLUB</span><span>{totalVotes} VOTE{totalVotes === 1 ? "" : "S"} CAST</span>
          </div>

          <div className="relative grid grid-cols-2 gap-3 sm:gap-6 mt-5">
            {[1, 2].map((w) => (
              <button
                key={w}
                type="button"
                onClick={(e) => vote(w, e.currentTarget)}
                disabled={busy}
                aria-pressed={myVote === w}
                className={`press relative overflow-hidden text-left p-3.5 sm:p-6 min-h-[200px] sm:min-h-[260px] flex flex-col ${SIDE[w].bg} ${SIDE[w].text} ${SIDE[w].shadow} ${myVote && myVote !== w ? "saturate-[.55]" : ""}`}
              >
                <span className="pixel text-[9px] sm:text-[11px] opacity-90">{SIDE[w].corner}</span>
                <span className="poster text-[clamp(52px,16vw,120px)] mt-2">W{w}</span>
                <span className="poster-wide text-[15px] sm:text-2xl mt-1">{WEEKENDS[w].dates}</span>
                <span className="mt-auto pt-3 pixel text-[9px] sm:text-[11px]">
                  {myVote === w ? "✓ YOUR CORNER" : me ? "TAP TO VOTE" : "GET A PASS TO VOTE"}
                </span>
                <AnimatePresence>
                  {ko === w && (
                    <motion.span
                      initial={{ scale: 3, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: -14, opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 500, damping: 12 }}
                      className="absolute right-2 top-10 sm:right-6 sm:top-12 poster text-[48px] sm:text-[84px] text-tape [-webkit-text-stroke:2px_#22122e]"
                      aria-hidden="true"
                    >
                      KO!
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-tape border-[3px] border-ink grid place-items-center poster text-2xl sm:text-4xl rotate-[-8deg] pointer-events-none" aria-hidden="true">
              VS
            </div>
          </div>

          {/* tale of the tape */}
          <div className="mt-8 flex flex-col gap-5" aria-label="Current results">
            {[1, 2].map((w) => (
              <div key={w}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="poster-wide text-xl sm:text-2xl inline-flex items-center gap-2">
                    {WEEKENDS[w].label}
                    {weekendLeader === w && <span className="pixel text-[10px] bg-ink text-tape px-1.5 py-0.5">LEADING</span>}
                  </span>
                  <span className="poster-wide text-xl sm:text-2xl tabular-nums">
                    <RollingNumber value={pct(w)} />% <span className="text-dusk text-base sm:text-lg">· <RollingNumber value={tally[w]} /> vote{tally[w] === 1 ? "" : "s"}</span>
                  </span>
                </div>
                <Bar filled={totalVotes ? Math.round((tally[w] / totalVotes) * SEGMENTS) : 0} color={SIDE[w].fill} />
              </div>
            ))}
          </div>

          <Hand className="block mt-6 text-cobalt text-xl" rotate={-1}>
            <Swords className="inline w-5 h-5 -mt-1 mr-1" aria-hidden="true" />
            the countdown follows whichever weekend is winning.
          </Hand>
        </motion.div>
      </div>
    </section>
  );
}

/* █████████ style bar built from blocks that pop in one by one */
function Bar({ filled, color }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-[3px] mt-2" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }} aria-hidden="true">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <motion.span
          key={i}
          className="h-6 sm:h-8 border-2 border-ink"
          initial={false}
          animate={{ backgroundColor: i < filled ? color : "rgba(34,18,46,0)", scaleY: i < filled ? 1 : 0.55 }}
          transition={reduce ? { duration: 0 } : { delay: i * 0.025, type: "spring", stiffness: 500, damping: 18 }}
        />
      ))}
    </div>
  );
}
