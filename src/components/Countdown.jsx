import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTrip } from "../lib/trip";
import { COUNTDOWN_WEEKEND, WEEKENDS } from "../config";
import { pad } from "../lib/format";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Countdown() {
  const { weekendLeader } = useTrip();
  const now = useNow();
  const w = COUNTDOWN_WEEKEND || weekendLeader || 1;
  const target = new Date(WEEKENDS[w].start).getTime();
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(s / 86400); s %= 86400;
  const hours = Math.floor(s / 3600); s %= 3600;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const arrived = target <= now;

  return (
    <section id="countdown" aria-labelledby="cd-title" className="relative bg-pink text-ink border-t-[3px] border-ink py-20 sm:py-28 overflow-hidden">
      <div className="absolute -right-[30%] -bottom-[40%] w-[120vw] max-w-[900px] aspect-square rounded-full sun-stripes opacity-40 pointer-events-none"
        style={{ WebkitMask: "radial-gradient(circle,#000 69%,transparent 70%)", mask: "radial-gradient(circle,#000 69%,transparent 70%)" }} aria-hidden="true" />
      <div className="gutter relative mx-auto max-w-6xl">
        <p className="pixel text-xs text-paper">
          COUNTING TO {WEEKENDS[w].label} · {WEEKENDS[w].dates}, 2027{!COUNTDOWN_WEEKEND && weekendLeader ? " · CURRENT WEEKEND WAR LEADER" : ""}
        </p>
        <h2 id="cd-title" className="poster text-[clamp(44px,13vw,120px)] mt-3 text-paper [text-shadow:5px_5px_0_#22122e]">
          {arrived ? "We're in the desert" : "Days until the desert"}
        </h2>

        {!arrived && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-8" role="timer" aria-live="off"
            aria-label={`${days} days, ${hours} hours, ${mins} minutes until ${WEEKENDS[w].label}`}>
            <div className="flex items-end gap-3">
              <span className="poster text-[clamp(150px,52vw,360px)] leading-[.74] text-ink [-webkit-text-stroke:0] tabular-nums">{days}</span>
              <span className="poster-wide text-4xl sm:text-5xl pb-3">DAYS</span>
            </div>
            <div className="flex gap-2.5 sm:gap-3 sm:pb-4">
              <Unit v={hours} label="HOURS" />
              <Unit v={mins} label="MINUTES" />
              <Unit v={secs} label="SECONDS" />
            </div>
          </div>
        )}
        <p className="font-hand text-2xl text-paper mt-6 -rotate-1 max-w-[30ch]">
          start saving. sunscreen is a budget line item.
        </p>
      </div>
    </section>
  );
}

function Unit({ v, label }) {
  const reduce = useReducedMotion();
  const val = pad(v);
  return (
    <div className="bg-ink text-tape border-[3px] border-ink shadow-[5px_5px_0_#fbf1df] px-3 pt-2 pb-1.5 min-w-[84px] sm:min-w-[104px] text-center">
      <div className="relative h-[44px] sm:h-[54px] overflow-hidden pixel text-[38px] sm:text-[48px] leading-[44px] sm:leading-[54px] tabular-nums">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={val} className="block"
            initial={reduce ? false : { y: "-100%" }} animate={{ y: 0 }} exit={reduce ? undefined : { y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}>
            {val}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="pixel text-[9px] text-paper mt-0.5">{label}</div>
    </div>
  );
}
