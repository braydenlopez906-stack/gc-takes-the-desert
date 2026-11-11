import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTrip } from "../lib/trip";
import PassCard from "./PassCard";
import { Bump, RollingNumber, SectionHead, Script } from "./ui";

export default function Roster() {
  const { people, ins, maybes, me, status } = useTrip();
  const known = useRef(null);
  const [freshIds, setFreshIds] = useState(new Set());

  // Passes that appear after the first load drop in from above.
  useEffect(() => {
    if (status !== "ready") return;
    if (known.current === null) { known.current = new Set(people.map((p) => p.id)); return; }
    const fresh = people.filter((p) => !known.current.has(p.id)).map((p) => p.id);
    if (fresh.length) {
      fresh.forEach((id) => known.current.add(id));
      setFreshIds(new Set(fresh));
    }
  }, [people, status]);

  const ordered = [...ins, ...maybes];
  const slots = Math.max(1, 3 - ordered.length);

  return (
    <section id="roster" aria-labelledby="roster-title" className="relative bg-dune border-t-[3px] border-ink py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(90deg,transparent_0_46px,rgba(34,18,46,.05)_46px_47px)]" aria-hidden="true" />
      <div className="gutter relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <SectionHead id="roster-title" kicker="The official list · updates live" lines={["THE 2027", <>ROSTER <Script className="text-cobalt">baby</Script></>]} />

          <div className="flex items-center gap-4" aria-live="polite">
            <Bump value={ins.length} className="poster text-[clamp(96px,30vw,170px)] text-pink [-webkit-text-stroke:3px_#22122e] [text-shadow:6px_6px_0_#22122e]">
              <RollingNumber value={ins.length} pad={2} />
            </Bump>
            <div className="poster-wide text-[26px] sm:text-[32px] leading-[.95]">
              {ins.length === 1 ? "PERSON" : "PEOPLE"}<br />LOCKED IN
              <span className="block font-hand normal-case font-normal text-xl text-dusk mt-1.5 max-w-[14ch]">
                {maybes.length ? `+ ${maybes.length} still deciding (we see you)` : ins.length ? "zero fence-sitters. iconic." : "who's first?"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-6">
          <AnimatePresence initial={false}>
            {ordered.map((p) => (
              <PassCard key={p.id} person={p} isMe={me?.id === p.id} fresh={freshIds.has(p.id)} />
            ))}
          </AnimatePresence>
          {status === "ready" && Array.from({ length: slots }, (_, i) => <OpenSlot key={`slot-${i}`} first={i === 0 && !me} i={i} />)}
        </div>

        {status === "loading" && <p className="text-center pixel text-xs text-dusk mt-10">Loading the roster…</p>}
        {status === "error" && <p className="text-center pixel text-xs text-[#c2002f] mt-10">The roster didn't load. Check your signal and refresh.</p>}
        {status === "offline" && <p className="text-center pixel text-xs text-dusk mt-10">Roster offline: the database isn't connected yet.</p>}
      </div>
    </section>
  );
}

function OpenSlot({ first, i }) {
  return (
    <motion.a
      href="#join"
      layout
      initial={false}
      animate={{ rotate: i % 2 ? 2 : -2 }}
      whileHover={{ rotate: 0, y: -4 }}
      className={`relative w-[min(100%,260px)] mt-11 ${i > 0 ? "hidden sm:block" : ""}`}
      aria-label="Open slot. Claim your pass."
    >
      <span aria-hidden="true" className="absolute -top-11 left-1/2 -translate-x-1/2 w-5 h-[52px] opacity-35 [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)] bg-[repeating-linear-gradient(180deg,#2a3cff_0_8px,#ff3a87_8px_16px)]" />
      <div className="min-h-[300px] rounded-xl border-[3px] border-dashed border-ink/45 flex flex-col items-center justify-center gap-2 text-center text-dusk hover:bg-paper/60 transition-colors px-4">
        <span className="poster text-[90px] text-ink/25">?</span>
        <span className="font-hand text-2xl leading-tight">{first ? <>this pass has your<br />name on it</> : "slot open"}</span>
        <span className="pixel text-[10px]">TAP TO CLAIM</span>
      </div>
    </motion.a>
  );
}
