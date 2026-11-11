import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, HelpCircle, RotateCw } from "lucide-react";
import { pad, hash } from "../lib/format";
import { PlayButton } from "./Music";
import { WEEKENDS } from "../config";

const IN_COLORS = [
  "bg-pink text-paper",
  "bg-cobalt text-paper",
  "bg-sunset text-ink",
];

/* A laminated festival pass on a lanyard. Tap to flip it over. */
export default function PassCard({ person, isMe = false, fresh = false, swing = true }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const isIn = person.status === "in";
  const tilt = swing ? ((hash(person.id) % 9) - 4) * 0.9 : 0;
  const face = isIn ? IN_COLORS[(person.passNo - 1) % IN_COLORS.length] : "bg-paper text-dusk border-dashed";
  const joined = new Date(person.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <motion.article
      layout={!reduce}
      initial={fresh && !reduce ? { y: -180, rotate: 25, opacity: 0 } : false}
      animate={{ y: 0, rotate: tilt, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 220, damping: 15 }}
      whileHover={reduce ? undefined : { rotate: -tilt, y: -4 }}
      style={{ transformOrigin: "50% -40px" }}
      className="relative w-[min(100%,260px)] mt-11 [perspective:1000px]"
      aria-label={`${person.name}, ${isIn ? "locked in" : "still deciding"}${person.artist ? `, most hyped for ${person.artist}` : ""}`}
    >
      {/* lanyard + clip */}
      <span aria-hidden="true" className="absolute -top-11 left-1/2 -translate-x-1/2 w-5 h-[52px] [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)] bg-[repeating-linear-gradient(180deg,#2a3cff_0_8px,#ff3a87_8px_16px)]" />
      <span aria-hidden="true" className="absolute top-0.5 left-1/2 -translate-x-1/2 w-8 h-3.5 rounded bg-[#c9c3cf] border-2 border-ink z-10" />

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? "Flip pass to front" : "Flip pass to back"}
        className="relative block w-full text-left [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.2)]"
        style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        {/* FRONT */}
        <div className={`relative overflow-hidden border-[3px] border-ink rounded-xl px-4 pt-7 pb-3.5 min-h-[300px] flex flex-col [backface-visibility:hidden] ${face} ${isIn ? "holo shadow-hard" : ""}`}>
          <div className="flex justify-between pixel text-[10px] gap-2">
            <span>{isIn ? "ALL ACCESS" : "PENDING"}</span>
            <span>Nº {pad(person.passNo, 3)}</span>
          </div>
          <h3 className="poster text-[clamp(44px,13vw,56px)] mt-3.5 mb-2.5 max-w-[86%] [overflow-wrap:anywhere]">{person.name}</h3>
          <span className={`inline-flex items-center gap-1.5 self-start px-2 py-1 pixel text-[11px] ${isIn ? "bg-ink text-tape" : "border-2 border-dashed border-dusk"}`}>
            {isIn ? <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" /> : <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />}
            {isIn ? "LOCKED IN" : "STILL DECIDING"}
          </span>
          {isIn && (
            <motion.div
              initial={fresh && !reduce ? { scale: 2.6, rotate: -50, opacity: 0 } : false}
              animate={{ scale: 1, rotate: -18, opacity: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 12, delay: fresh ? 0.6 : 0 }}
              className="absolute right-3 top-[86px] w-[78px] aspect-square rounded-full border-[3px] border-current grid place-items-center text-center poster-wide text-[12px] leading-[.95]"
              aria-hidden="true"
            >
              GC<br />'27<br />✓
            </motion.div>
          )}
          <div className="mt-auto pt-4 pr-11 border-t-2 border-current">
            <div className="pixel text-[9px] opacity-85">MOST HYPED FOR</div>
            <div className={`${isIn ? "font-script text-[22px]" : "font-hand text-[25px]"} leading-tight [overflow-wrap:anywhere]`}>{person.artist || "TBD"}</div>
          </div>
        </div>

        {/* BACK */}
        <div className={`absolute inset-0 overflow-hidden border-[3px] border-ink rounded-xl p-4 pt-7 flex flex-col gap-3 bg-ink text-paper [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
          <div className="pixel text-[10px] text-tape flex justify-between"><span>GC · COACHELLA 2027</span><span>Nº {pad(person.passNo, 3)}</span></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm mt-2">
            <dt className="pixel text-[10px] text-tape/80 pt-0.5">HOLDER</dt><dd className="font-semibold [overflow-wrap:anywhere]">{person.name}</dd>
            <dt className="pixel text-[10px] text-tape/80 pt-0.5">JOINED</dt><dd>{joined}</dd>
            <dt className="pixel text-[10px] text-tape/80 pt-0.5">WEEKEND</dt><dd>{person.weekend ? `${WEEKENDS[person.weekend].label} (${WEEKENDS[person.weekend].dates})` : "hasn't voted"}</dd>
            <dt className="pixel text-[10px] text-tape/80 pt-0.5">STATUS</dt><dd>{isIn ? "Locked in" : "Still deciding"}</dd>
          </dl>
          <p className="font-hand text-tape text-xl leading-tight mt-auto -rotate-2">{isIn ? "no refunds on vibes." : "the desert is calling. pick up."}</p>
          <div className="barcode h-8 opacity-90 invert" aria-hidden="true" />
        </div>
      </button>

      <span aria-hidden="true" className="absolute -bottom-3 right-2 pixel text-[9px] flex items-center gap-1 text-dusk"><RotateCw className="w-3 h-3" />TAP</span>
      {person.artist && !flipped && (
        <div className="absolute right-3.5 bottom-5 z-20">
          <PlayButton artist={person.artist} size="sm" tone={isIn ? "tape" : "ink"} />
        </div>
      )}

      {!isIn && <span aria-hidden="true" className="absolute -right-2 top-12 font-hand text-cobalt text-lg bg-tape px-1.5 rotate-[10deg] z-10 pointer-events-none">c'mon…</span>}
      {isMe && <span aria-hidden="true" className="absolute -left-3 -bottom-4 font-hand text-paper text-lg bg-ink px-2 py-0.5 -rotate-6 z-10 pointer-events-none">← that's you</span>}
    </motion.article>
  );
}
