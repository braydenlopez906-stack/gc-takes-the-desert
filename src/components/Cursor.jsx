import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/* A small sun that follows the mouse. Desktop only; phones keep their normal touch. */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 30 }), ry = useSpring(y, { stiffness: 380, damping: 30 });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mq.matches || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      setHot(Boolean(e.target.closest?.("a, button, label, [role=button]")));
    };
    const dn = () => setDown(true), up = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div aria-hidden="true" style={{ x: rx, y: ry }} className="fixed left-0 top-0 z-[90] pointer-events-none">
        <motion.div
          animate={{ scale: down ? 0.7 : hot ? 1.9 : 1, rotate: hot ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="-translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-ink bg-[repeating-linear-gradient(180deg,#ff6a1a_0_4px,transparent_4px_6px)] opacity-80"
        />
      </motion.div>
      <motion.div aria-hidden="true" style={{ x, y }} className="fixed left-0 top-0 z-[91] pointer-events-none">
        <div className="-translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-pink" />
      </motion.div>
    </>
  );
}
