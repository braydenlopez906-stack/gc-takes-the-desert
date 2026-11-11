import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useAnimationControls, useInView, useReducedMotion } from "framer-motion";

/* Springs shared across the site: things land like rubber stamps. */
export const stamp = { type: "spring", stiffness: 520, damping: 18, mass: 0.8 };
export const drop = { type: "spring", stiffness: 260, damping: 16 };

/* Section heading: kicker in pixel type, poster headline that rises line by line. */
export function SectionHead({ kicker, lines = [], tone = "ink", className = "", id }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  return (
    <header ref={ref} className={className}>
      {kicker && <p className={`pixel text-[11px] sm:text-xs mb-2 ${tone === "light" ? "text-tape" : "text-pink"}`}>{kicker}</p>}
      <h2 id={id} className={`poster text-[clamp(56px,17vw,150px)] ${tone === "light" ? "text-paper" : "text-ink"}`}>
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[.05em]">
            <motion.span
              className="block"
              initial={reduce ? false : { y: "105%", rotate: 3 }}
              animate={inView || reduce ? { y: 0, rotate: 0 } : undefined}
              transition={{ ...drop, delay: i * 0.08 }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h2>
    </header>
  );
}

/* Script accent word for headlines */
export const Script = ({ children, className = "" }) => (
  <span className={`font-script normal-case tracking-normal inline-block -rotate-6 text-[.55em] align-[.15em] ${className}`}>{children}</span>
);

/* Handwritten note */
export const Hand = ({ children, className = "", rotate = -3 }) => (
  <span className={`font-hand leading-[1.05] inline-block ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>{children}</span>
);

/* Number that rolls to its new value */
export function RollingNumber({ value, pad = 0, className = "" }) {
  const ref = useRef(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (n) => String(Math.round(n)).padStart(pad, "0");
    if (reduce || prev.current === value) { el.textContent = fmt(value); prev.current = value; return; }
    const ctrl = animate(prev.current, value, { duration: 0.8, ease: [0.2, 0.9, 0.3, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
    prev.current = value;
    return () => ctrl.stop();
  }, [value, pad, reduce]);
  return <span ref={ref} className={`tabular-nums ${className}`}>{String(value).padStart(pad, "0")}</span>;
}

/* Sticker you can fling around a little; springs back. */
export function Sticker({ children, className = "", rotate = 0, drag = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`select-none ${className}`}
      style={{ rotate }}
      drag={drag && !reduce}
      dragSnapToOrigin
      dragElastic={0.6}
      whileDrag={{ scale: 1.12, rotate: rotate + 8, zIndex: 40 }}
      whileHover={reduce ? undefined : { rotate: rotate - 4, scale: 1.04 }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  );
}

/* Toasts */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((text, tone = "ink") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed z-[70] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none w-[min(92vw,420px)]"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)" }} role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id}
              initial={{ y: 30, opacity: 0, rotate: -4, scale: 0.9 }} animate={{ y: 0, opacity: 1, rotate: -1.5, scale: 1 }} exit={{ y: 20, opacity: 0 }}
              transition={stamp}
              className={`px-4 py-2.5 border-[3px] border-ink shadow-hard font-hand text-xl leading-tight text-center ${t.tone === "pink" ? "bg-pink text-paper" : t.tone === "error" ? "bg-paper text-[#c2002f]" : "bg-tape text-ink"}`}>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* Burst of paper confetti from a point */
let confettiCanvas = null;
export function confetti(x, y, count = 120) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!confettiCanvas) {
    confettiCanvas = document.createElement("canvas");
    Object.assign(confettiCanvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "80" });
    confettiCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(confettiCanvas);
  }
  const cv = confettiCanvas, ctx = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ["#ff3a87", "#2a3cff", "#ff6a1a", "#ffe14a", "#fbf1df"];
  const bits = Array.from({ length: count }, (_, i) => ({
    x, y, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, w: 6 + Math.random() * 7, h: 4 + Math.random() * 5,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35, c: cols[i % cols.length], life: 0,
  }));
  const step = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const b of bits) {
      if (b.life++ > 150 || b.y > innerHeight + 30) continue;
      alive++;
      b.vy += 0.42; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
    }
    if (alive) requestAnimationFrame(step); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(step);
}

export function confettiFrom(el, count) {
  const r = el?.getBoundingClientRect?.();
  if (r) confetti(r.left + r.width / 2, r.top + r.height / 2, count);
}

/* Wobbles its children whenever `value` changes */
export function Bump({ value, children, className = "" }) {
  const controls = useAnimationControls();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    controls.start({ scale: [1, 1.22, 1], rotate: [0, -6, 0], transition: { duration: 0.55, ease: [0.2, 0.9, 0.3, 1.4] } });
  }, [value, controls]);
  return <motion.div animate={controls} className={className}>{children}</motion.div>;
}
