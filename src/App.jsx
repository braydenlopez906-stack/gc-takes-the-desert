import { useCallback, useRef, useState } from "react";
import { TripProvider } from "./lib/trip";
import { ToastProvider, useToast } from "./components/ui";
import Ticker from "./components/Ticker";
import Hero from "./components/Hero";
import JoinDesk from "./components/JoinDesk";
import Roster from "./components/Roster";
import MostWanted from "./components/MostWanted";
import WeekendWar from "./components/WeekendWar";
import TheCrib from "./components/TheCrib";
import TripStatus from "./components/TripStatus";
import Countdown from "./components/Countdown";
import Memories from "./components/Memories";
import Footer from "./components/Footer";
import Cursor from "./components/Cursor";
import Intro from "./components/Intro";
import StickyJoin from "./components/StickyJoin";
import EasterEggs, { sandstorm } from "./components/EasterEggs";

function Site() {
  const toast = useToast();
  const [golden, setGolden] = useState(false);
  const taps = useRef([]);

  // Tap the sun five times quickly for golden hour.
  const onSunTap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setGolden(true);
      sandstorm();
      toast("Golden hour unlocked.", "pink");
      setTimeout(() => setGolden(false), 10000);
    }
  }, [toast]);

  return (
    <div className={golden ? "golden" : ""}>
      <a href="#join" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[99] bg-tape px-3 py-2 border-2 border-ink">Skip to sign-up</a>
      <Ticker />
      <main>
        <Hero onSunTap={onSunTap} />
        <JoinDesk />
        <Roster />
        <MostWanted />
        <WeekendWar />
        <TheCrib />
        <TripStatus />
        <Countdown />
        <Memories />
      </main>
      <Footer />
      <StickyJoin />
      <EasterEggs />
    </div>
  );
}

export default function App() {
  return (
    <TripProvider>
      <ToastProvider>
        <Intro />
        <Cursor />
        <div className="grain" aria-hidden="true" />
        <Site />
      </ToastProvider>
    </TripProvider>
  );
}
