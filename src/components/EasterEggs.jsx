import { useEffect } from "react";
import { confetti, useToast } from "./ui";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export function sandstorm() {
  for (let i = 0; i < 5; i++) setTimeout(() => confetti(Math.random() * innerWidth, -10, 70), i * 160);
}

/* Type "desert" (or the Konami code) anywhere outside a text box. */
export default function EasterEggs() {
  const toast = useToast();
  useEffect(() => {
    let buf = [];
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      buf = [...buf, e.key].slice(-10);
      const word = buf.join("").toLowerCase();
      if (word.endsWith("desert") || buf.join() === KONAMI.join()) {
        buf = [];
        sandstorm();
        toast("SANDSTORM. GC field trip unlocked.", "pink");
      }
    };
    window.addEventListener("keydown", onKey);
    console.log("%cGC TAKES THE DESERT", "font:900 28px Impact;color:#ff3a87;text-shadow:3px 3px 0 #22122e", "\nyou found the console. type 'desert' on the page.");
    return () => window.removeEventListener("keydown", onKey);
  }, [toast]);
  return null;
}
