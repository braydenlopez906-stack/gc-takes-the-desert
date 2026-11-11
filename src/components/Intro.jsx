import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* Wristband scan at the gate. Plays once per visit, about a second, tap to skip. */
export default function Intro() {
  const [show, setShow] = useState(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      return !sessionStorage.getItem("gc27.intro");
    } catch { return false; }
  });
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem("gc27.intro", "1"); } catch {}
    const a = setTimeout(() => setGranted(true), 650);
    const b = setTimeout(() => setShow(false), 1350);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          onClick={() => setShow(false)}
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] bg-ink text-paper grid place-items-center gutter"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div initial={{ x: -260, rotate: -8 }} animate={{ x: 0, rotate: -3 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative w-[280px] h-14 bg-pink border-[3px] border-paper flex items-center px-4 poster-wide text-lg overflow-hidden">
              GC · COACHELLA 2027
              <motion.span initial={{ x: -40 }} animate={{ x: 300 }} transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-y-0 w-6 bg-[#7dff9b] opacity-70 blur-[2px]" />
            </motion.div>
            <div className="h-12 grid place-items-center">
              {granted ? (
                <motion.span initial={{ scale: 2.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14 }}
                  className="poster text-5xl text-tape border-4 border-tape px-3 pt-1">ACCESS GRANTED</motion.span>
              ) : (
                <span className="pixel text-xs text-paper/70">SCANNING WRISTBAND…</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
