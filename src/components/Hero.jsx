import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTrip } from "../lib/trip";
import { Sticker, confettiFrom, drop } from "./ui";

export default function Hero({ onSunTap }) {
  const { ins, maybes, me, status } = useTrip();
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sunY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const collageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);

  const go = (e) => {
    e.preventDefault();
    confettiFrom(e.currentTarget, 90);
    document.getElementById("join")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => document.getElementById("join-name")?.focus({ preventScroll: true }), reduce ? 0 : 700);
  };

  const line = (i) => ({ initial: reduce ? false : { y: "110%", rotate: 4 }, animate: { y: 0, rotate: 0 }, transition: { ...drop, delay: 0.15 + i * 0.09 } });

  return (
    <header ref={ref} className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-24">
      {/* the sun: tap it a few times */}
      <motion.button
        type="button"
        onClick={onSunTap}
        aria-label="The sun"
        style={{ y: sunY }}
        className="absolute z-0 -right-[38vw] top-[34%] w-[118vw] max-w-[760px] aspect-square rounded-full sm:-right-[10%] sm:top-[-4%] sm:w-[62vw]"
      >
        <span className="absolute inset-0 rounded-full sun-stripes opacity-90" style={{ WebkitMask: "radial-gradient(circle,#000 69%,transparent 70%)", mask: "radial-gradient(circle,#000 69%,transparent 70%)" }} />
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-tape/70 to-pink/60 mix-blend-multiply" style={{ WebkitMask: "radial-gradient(circle,#000 69%,transparent 70%)", mask: "radial-gradient(circle,#000 69%,transparent 70%)" }} />
      </motion.button>

      <div className="gutter relative z-10 mx-auto max-w-6xl grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="poster flex flex-col text-[clamp(72px,23vw,190px)] md:text-[min(10vw,160px)]" aria-label="River Retards vs. Coachella '27">
            <span className="block overflow-hidden pb-[.04em]" aria-hidden="true">
              <motion.span className="block" {...line(0)}>RIVER</motion.span>
            </span>
            <span className="block overflow-hidden pb-[.04em]" aria-hidden="true">
              <motion.span className="block outline-ink" {...line(1)}>RETARDS</motion.span>
            </span>
            <span className="block relative z-10 -my-[.12em] ml-[.15em]" aria-hidden="true">
              <motion.span className="inline-block font-script normal-case text-pink text-[.6em] tracking-normal [text-shadow:4px_4px_0_#22122e]"
                initial={reduce ? false : { scale: 2.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: -7, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.55 }}>vs.</motion.span>
            </span>
            <span className="block overflow-hidden pb-[.04em] text-[.62em] leading-[.9]" aria-hidden="true">
              <motion.span className="block" {...line(3)}>COACHELLA <span className="text-cobalt">'27</span></motion.span>
            </span>
          </h1>

          <motion.div initial={reduce ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...drop, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="#join" onClick={go}
              className="press group inline-flex items-center gap-3 bg-pink text-paper poster-wide text-[34px] sm:text-[40px] px-7 pt-3.5 pb-3 shadow-hard-lg">
              {me ? "MY PASS" : "I'M IN"}
              <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-1.5" strokeWidth={3} aria-hidden="true" />
            </a>
            <a href="#roster" className="font-hand text-2xl underline decoration-wavy decoration-pink underline-offset-[6px]">who's already in?</a>
          </motion.div>

          <p className="mt-6 pixel text-[11px] sm:text-xs flex items-center gap-2.5" aria-live="polite">
            <span className="w-2.5 h-2.5 rounded-full bg-pink live-dot" aria-hidden="true" />
            {status === "ready"
              ? ins.length
                ? `${ins.length} locked in${maybes.length ? ` · ${maybes.length} on the fence` : ""} · live`
                : "Roster's open. Be the first one in."
              : status === "loading" ? "Checking the roster…" : "Roster offline"}
          </p>
        </div>

        {/* collage */}
        <motion.div style={{ y: collageY }} className="relative h-[500px] sm:h-[560px] mt-4 md:mt-0 pointer-events-auto" aria-hidden="true">
          <Print tilt={-8} className="left-[1%] top-6 w-[46%] max-w-[230px]" src="/hero/squid-games-pregame.jpg" delay={0.3} />
          <Print tilt={6} className="right-[1%] top-0 w-[46%] max-w-[230px]" src="/hero/pole.jpg" delay={0.45} />
          <Print tilt={-3} className="left-[14%] top-[190px] sm:top-[235px] w-[66%] max-w-[330px] z-[3]" src="/hero/lush-life.jpg" aspect="aspect-[4/3]" delay={0.6} />

          <Sticker className="absolute -left-1 bottom-2 z-[5]" rotate={7}>
            <div className="flex drop-shadow-[5px_6px_0_#22122e]">
              <div className="notch-r bg-cobalt text-paper px-4 py-3 border-r-[3px] border-dashed border-sand">
                <div className="pixel text-[9px] opacity-80">ADMIT</div>
                <div className="poster-wide text-[22px] sm:text-[28px] leading-[.9]">THE WHOLE<br />GROUP CHAT</div>
                <div className="flex gap-4 mt-2 poster-wide text-sm"><span>APR 2027</span><span>GA</span></div>
              </div>
              <div className="notch-l bg-cobalt text-paper px-2 py-3 pixel text-[9px] [writing-mode:vertical-rl] grid place-items-center">Nº 0027 · KEEP</div>
            </div>
          </Sticker>

          <Sticker className="absolute right-[4%] bottom-12 z-[6]" rotate={-14}>
            <div className="relative w-[108px] sm:w-[128px] aspect-square rounded-full border-4 border-double border-pink text-pink grid place-items-center text-center poster-wide text-[13px] leading-none bg-sand/40">
              <svg viewBox="0 0 132 132" className="absolute inset-0 w-full h-full spin-slow">
                <defs><path id="circ" d="M66,66 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" /></defs>
                <text className="pixel" fontSize="10.5" fill="#ff3a87" letterSpacing="1.5"><textPath href="#circ">✦ NO FLAKES ✦ NO FLAKES ✦ NO FLAKES</textPath></text>
              </svg>
              DESERT<br />BOUND
            </div>
          </Sticker>

        </motion.div>
      </div>
    </header>
  );
}

function Print({ className, src, aspect = "aspect-[4/5]", delay, tilt = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      initial={reduce ? false : { y: -80, opacity: 0, rotate: tilt + 20 }}
      animate={{ y: 0, opacity: 1, rotate: tilt }}
      transition={{ ...drop, delay }}
      className={`absolute ${className}`}
    >
      <motion.div whileHover={reduce ? undefined : { scale: 1.05, rotate: -tilt, zIndex: 9 }} className="relative bg-paper p-2 pb-7 shadow-[0_14px_30px_rgba(34,18,46,.28)]">
        <span className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-3" />
        <img src={src} alt="" decoding="async" className={`block w-full ${aspect} object-cover bg-ink`} />
      </motion.div>
    </motion.figure>
  );
}
