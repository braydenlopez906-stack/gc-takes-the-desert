import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTrip } from "../lib/trip";

/* Phone-only floating "I'M IN" while you haven't joined and the form is off screen. */
export default function StickyJoin() {
  const { me, isConfigured } = useTrip();
  const [past, setPast] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const el = document.getElementById("join");
    let io;
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => setJoinVisible(e.isIntersecting), { threshold: 0.1 });
      io.observe(el);
    }
    return () => { window.removeEventListener("scroll", onScroll); io?.disconnect(); };
  }, []);

  const show = isConfigured && !me && past && !joinVisible;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="sticky"
          initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="md:hidden fixed z-[65] inset-x-0 flex justify-center pointer-events-none"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)" }}
        >
          <a href="#join" className="press pointer-events-auto -rotate-2 bg-pink text-paper poster-wide text-[26px] px-6 pt-2.5 pb-2 inline-flex items-center gap-2 shadow-hard-lg">
            I'M IN <ArrowRight className="w-6 h-6" strokeWidth={3} aria-hidden="true" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
