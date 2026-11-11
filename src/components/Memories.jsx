import { motion, useReducedMotion } from "framer-motion";
import { MEMORIES } from "../config";
import Scene from "./Scene";
import { Hand, SectionHead, Script, Sticker } from "./ui";

function Frame({ m, i }) {
  return m.src ? (
    <img src={m.src} alt={m.caption} loading="lazy" className="block w-full aspect-[4/5] object-cover" />
  ) : (
    <Scene scene={m.scene} seed={i + 3} stamp={m.stamp} label={m.caption} />
  );
}

export default function Memories() {
  const reduce = useReducedMotion();
  const strip = [...MEMORIES, ...MEMORIES];
  const book = MEMORIES.slice(0, 4);
  const tilts = [-6, 4, -3, 7];

  return (
    <section id="memories" aria-labelledby="mem-title" className="relative bg-paper border-t-[3px] border-ink pt-20 sm:pt-28 pb-32 overflow-hidden">
      <div className="gutter relative mx-auto max-w-6xl">
        <SectionHead id="mem-title" kicker="Pre-memories · not real yet" lines={["THE", <>SCRAPBOOK <Script className="text-pink">'27</Script></>]} />
        <Hand className="mt-4 text-cobalt text-2xl max-w-[30ch]">future photos, drawn in advance. we'll swap in the real ones after.</Hand>
      </div>

      {/* film strip */}
      <div className="relative mt-12 bg-ink py-6 -rotate-2 scale-[1.04] marquee-pause" aria-label="Film strip">
        <Sprockets />
        <div className="overflow-hidden">
          <div className="flex w-max gap-4 marquee-slow px-2">
            {strip.map((m, i) => (
              <figure key={i} className="relative w-[180px] sm:w-[230px] shrink-0 bg-[#2b1a20] p-1.5" aria-hidden={i >= MEMORIES.length || undefined}>
                <Frame m={m} i={i % MEMORIES.length} />
                <figcaption className="pixel text-[9px] text-sunset mt-1.5 flex justify-between"><span>{String((i % MEMORIES.length) + 1).padStart(2, "0")}A</span><span>KODAK-ISH 400</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
        <Sprockets />
      </div>

      {/* scrapbook page */}
      <div className="gutter relative mx-auto max-w-6xl mt-20">
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12">
          {book.map((m, i) => (
            <motion.figure
              key={m.caption}
              initial={reduce ? false : { y: 40, rotate: tilts[i] * 2.5 }}
              whileInView={{ y: 0, rotate: tilts[i] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: "spring", stiffness: 180, damping: 15, delay: i * 0.08 }}
              whileHover={reduce ? undefined : { rotate: 0, scale: 1.04, zIndex: 5 }}
              className={`relative bg-paper p-2 pb-14 shadow-[0_14px_30px_rgba(34,18,46,.25)] border border-ink/10 ${i % 2 ? "md:mt-14" : ""}`}
            >
              <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-3" aria-hidden="true" />
              <Frame m={m} i={i} />
              <figcaption className="absolute left-3 right-3 bottom-2 font-hand text-[19px] sm:text-[22px] leading-[1.05]">{m.caption}</figcaption>
            </motion.figure>
          ))}

          <Sticker className="absolute -top-10 right-2 md:right-[22%] z-10" rotate={-12}>
            <div className="bg-cobalt text-paper border-[3px] border-ink px-3 py-1.5 poster-wide text-lg shadow-[4px_4px_0_#22122e]">GC FIELD TRIP</div>
          </Sticker>
          <Sticker className="absolute -bottom-16 right-0 md:-bottom-10 md:right-[-10px] z-10" rotate={8}>
            <div className="w-[96px] aspect-square rounded-full bg-tape border-[3px] border-ink grid place-items-center text-center poster-wide text-[13px] leading-[.95] wobble" style={{ "--r": "8deg" }}>
              SEE YOU<br />IN THE<br />DESERT
            </div>
          </Sticker>
        </div>

        {/* wristband row */}
        <div className="mt-24 flex flex-col items-center gap-3">
          <div className="relative w-[min(100%,560px)] h-14 bg-pink border-[3px] border-ink flex items-center justify-between px-4 -rotate-2 shadow-hard">
            <span className="poster-wide text-paper text-lg sm:text-xl">GC · COACHELLA 2027 · 3-DAY</span>
            <span className="w-8 h-8 rounded-sm bg-[#c9c3cf] border-2 border-ink" aria-hidden="true" />
          </div>
          <Hand className="text-2xl" rotate={1}>bad financial decisions → great memories</Hand>
        </div>
      </div>
    </section>
  );
}

function Sprockets() {
  return <div className="h-3 my-2 mx-2 bg-[repeating-linear-gradient(90deg,#fbf1df_0_14px,transparent_14px_30px)] opacity-90" aria-hidden="true" />;
}
