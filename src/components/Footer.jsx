import { Hand } from "./ui";

export default function Footer() {
  return (
    <footer className="bg-ink text-paper border-t-[3px] border-pink pt-16 pb-28 sm:pb-16 overflow-hidden">
      <div className="gutter mx-auto max-w-6xl flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="poster text-[clamp(64px,20vw,150px)]">
            INDIO <span className="font-script normal-case text-pink text-[.5em] align-middle">or</span> BUST.
          </p>
          <p className="pixel text-[10px] text-paper/60 mt-4">MADE FOR THE GROUP CHAT · NOT AFFILIATED WITH COACHELLA OR GOLDENVOICE</p>
        </div>
        <Hand className="text-tape text-xl max-w-[22ch]" rotate={-4}>psst. the "vs." likes being tapped.</Hand>
      </div>
    </footer>
  );
}
