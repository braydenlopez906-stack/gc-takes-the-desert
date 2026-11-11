import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Pause, Play, VolumeX, X } from "lucide-react";
import { usePlayer } from "../lib/player";

/* Three bouncing bars while a song plays */
export function Equalizer({ className = "" }) {
  const reduce = useReducedMotion();
  return (
    <span className={`inline-flex items-end gap-[2px] h-[1em] ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-[3px] bg-current rounded-sm"
          animate={reduce ? { height: "60%" } : { height: ["30%", "100%", "45%", "85%", "30%"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
      ))}
    </span>
  );
}

/* Icon that reflects the player state for one artist */
export function PlayIcon({ state, className = "w-5 h-5" }) {
  if (state === "loading") return <Loader2 className={`${className} animate-spin`} aria-hidden="true" />;
  if (state === "playing") return <Pause className={className} fill="currentColor" aria-hidden="true" />;
  if (state === "missing") return <VolumeX className={className} aria-hidden="true" />;
  return <Play className={className} fill="currentColor" aria-hidden="true" />;
}

/* Round play button for an artist */
export function PlayButton({ artist, className = "", size = "md", tone = "ink" }) {
  const { toggle, stateFor } = usePlayer();
  const state = stateFor(artist);
  const dims = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const icon = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const colors = tone === "pink" ? "bg-pink text-paper" : tone === "tape" ? "bg-tape text-ink" : "bg-ink text-tape";
  return (
    <motion.button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(artist); }}
      whileTap={{ scale: 0.85 }}
      aria-label={`${state === "playing" ? "Pause" : "Play"} a song by ${artist}`}
      className={`relative shrink-0 rounded-full border-[3px] border-ink grid place-items-center shadow-[3px_3px_0_#22122e] ${dims} ${colors} ${className}`}
    >
      {state === "playing" && <span className="absolute inset-[-7px] rounded-full border-2 border-pink animate-ping opacity-40" aria-hidden="true" />}
      <PlayIcon state={state} className={icon} />
    </motion.button>
  );
}

/* Bar pinned to the bottom of the screen while something is playing */
export function NowPlaying() {
  const { current, status, progress, toggle, stop } = usePlayer();
  const reduce = useReducedMotion();
  const show = Boolean(current) && status !== "idle";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="np"
          initial={{ y: 140 }} animate={{ y: 0 }} exit={{ y: 140 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="fixed z-[66] inset-x-0 flex justify-center pointer-events-none"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
          role="region" aria-label="Now playing"
        >
          <div className="pointer-events-auto w-[min(94vw,520px)] bg-ink text-paper border-[3px] border-ink shadow-[6px_6px_0_#ff3a87] overflow-hidden">
            <div className="flex items-center gap-3 p-2.5 pr-3">
              <motion.div
                animate={status === "playing" && !reduce ? { rotate: 360 } : { rotate: 0 }}
                transition={status === "playing" ? { duration: 4, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                className="relative w-12 h-12 shrink-0 rounded-full bg-[radial-gradient(circle,#ff3a87_0_18%,#111_19%_100%)] border-2 border-paper/20 overflow-hidden"
                aria-hidden="true"
              >
                {current.artwork && <img src={current.artwork} alt="" className="absolute inset-[6px] rounded-full object-cover w-[calc(100%-12px)] h-[calc(100%-12px)]" />}
                <span className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
              </motion.div>

              <div className="min-w-0 flex-1">
                <p className="pixel text-[9px] text-tape flex items-center gap-1.5">
                  {status === "playing" ? <><Equalizer className="text-tape" /> NOW PLAYING</> : status === "loading" ? "FINDING A SONG…" : status === "missing" ? "NO PREVIEW FOUND" : "PAUSED"}
                </p>
                <p className="font-semibold leading-tight truncate">{current.track || current.artist}</p>
                <p className="text-sm text-paper/70 leading-tight truncate">
                  {current.track ? current.artist : status === "missing" ? "Apple Music has no clip for this name." : " "}
                </p>
              </div>

              {status !== "missing" && (
                <button type="button" onClick={() => toggle(current.artist)} aria-label={status === "playing" ? "Pause" : "Play"}
                  className="w-11 h-11 rounded-full bg-pink text-paper grid place-items-center border-2 border-paper/30 active:scale-90 transition-transform">
                  <PlayIcon state={status} />
                </button>
              )}
              <button type="button" onClick={stop} aria-label="Close player" className="w-9 h-9 grid place-items-center text-paper/70 hover:text-paper">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-1.5 bg-paper/15"><div className="h-full bg-pink transition-[width] duration-200" style={{ width: `${progress * 100}%` }} /></div>
            {current.link && (
              <a href={current.link} target="_blank" rel="noopener noreferrer" className="block text-center pixel text-[9px] text-paper/60 py-1 hover:text-tape">
                PREVIEW FROM APPLE MUSIC · LISTEN TO THE FULL SONG ↗
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
