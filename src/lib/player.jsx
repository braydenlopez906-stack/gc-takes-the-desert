import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/*
  One shared audio player. Tapping an artist plays a 30-second Apple Music preview of one
  of their songs; tapping again pauses. Lookups are cached and prefetched so the tap can
  start playback right away, which phones require.
*/

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

const keyOf = (artist) => String(artist || "").trim().toLowerCase().replace(/\s+/g, " ");
// A tiny silent clip, played inside the tap so iPhones allow the real clip afterwards.
const SILENT = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

export function PlayerProvider({ children }) {
  const audio = useRef(null);
  const cache = useRef(new Map()); // key -> song | null | Promise
  const want = useRef(null); // key the person most recently tapped
  const [current, setCurrent] = useState(null); // { key, artist, track, artwork, link }
  const [status, setStatus] = useState("idle"); // idle | loading | playing | paused | missing
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    // Ignore events from the silent unlock clip.
    const real = () => !a.src.startsWith("data:");
    a.addEventListener("timeupdate", () => real() && setProgress(a.duration ? a.currentTime / a.duration : 0));
    a.addEventListener("ended", () => { if (real()) { setStatus("idle"); setProgress(0); } });
    a.addEventListener("pause", () => real() && setStatus((s) => (s === "playing" ? "paused" : s)));
    a.addEventListener("playing", () => real() && setStatus("playing"));
    audio.current = a;
    return () => { a.pause(); a.src = ""; };
  }, []);

  const lookup = useCallback((artist) => {
    const k = keyOf(artist);
    if (!k) return Promise.resolve(null);
    const hit = cache.current.get(k);
    if (hit !== undefined) return Promise.resolve(hit);
    const p = fetch(`/api/song?artist=${encodeURIComponent(artist)}`)
      .then((r) => (r.ok ? r.json() : { song: null }))
      .then((d) => d.song || null)
      .catch(() => undefined) // network error: don't cache, allow retry
      .then((song) => {
        if (song === undefined) cache.current.delete(k);
        else cache.current.set(k, song);
        return song ?? null;
      });
    cache.current.set(k, p);
    return p;
  }, []);

  const prefetch = useCallback((artists) => {
    artists.slice(0, 12).forEach((a) => { if (!cache.current.has(keyOf(a))) lookup(a); });
  }, [lookup]);

  const start = useCallback((k, song) => {
    const a = audio.current;
    if (!a || want.current !== k) return;
    setCurrent({ key: k, ...song });
    setProgress(0);
    a.src = song.preview;
    a.currentTime = 0;
    a.volume = 1;
    a.play().then(() => setStatus("playing")).catch(() => setStatus("paused"));
  }, []);

  const toggle = useCallback((artist) => {
    const a = audio.current;
    const k = keyOf(artist);
    if (!a || !k) return;

    // Same artist: pause / resume
    if (current?.key === k && (status === "playing" || status === "paused")) {
      if (status === "playing") { a.pause(); setStatus("paused"); }
      else a.play().then(() => setStatus("playing")).catch(() => {});
      return;
    }

    want.current = k;
    const hit = cache.current.get(k);
    if (hit && !(hit instanceof Promise)) return start(k, hit); // ready: play inside the tap

    setCurrent({ key: k, artist, track: null, artwork: null, link: null });
    setProgress(0);
    if (hit === null) { a.pause(); setStatus("missing"); return; }
    // Not ready: unlock audio inside the tap, then play when the lookup lands.
    a.src = SILENT;
    a.play().catch(() => {});
    setStatus("loading");
    lookup(artist).then((song) => {
      if (want.current !== k) return;
      if (!song) { setStatus("missing"); return; }
      start(k, song);
    });
  }, [current, status, lookup, start]);

  const stop = useCallback(() => {
    want.current = null;
    audio.current?.pause();
    setStatus("idle");
    setCurrent(null);
    setProgress(0);
  }, []);

  const stateFor = useCallback((artist) => {
    if (!current || current.key !== keyOf(artist)) return "idle";
    return status;
  }, [current, status]);

  const value = useMemo(
    () => ({ current, status, progress, toggle, stop, prefetch, stateFor }),
    [current, status, progress, toggle, stop, prefetch, stateFor]
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
