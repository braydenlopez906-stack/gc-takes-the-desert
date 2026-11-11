import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";
import { useTrip } from "../lib/trip";
import { WEEKENDS } from "../config";
import { pad } from "../lib/format";
import { SectionHead, Script } from "./ui";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/* One split-flap character that clatters through a few letters before landing */
function FlapChar({ ch }) {
  const [shown, setShown] = useState(ch);
  const reduce = useReducedMotion();
  const first = useRef(true);
  useEffect(() => {
    if (first.current || reduce) { first.current = false; setShown(ch); return; }
    let n = 0;
    const steps = 4 + Math.floor(Math.random() * 5);
    const id = setInterval(() => {
      n++;
      if (n >= steps) { setShown(ch); clearInterval(id); }
      else setShown(CHARS[Math.floor(Math.random() * CHARS.length)]);
    }, 55);
    return () => clearInterval(id);
  }, [ch, reduce]);
  return <span className="flap w-[1.05em] h-[1.45em] text-[1em]">{shown === " " ? " " : shown}</span>;
}

function Flap({ text, className = "" }) {
  const t = String(text).toUpperCase();
  return (
    <span className={`inline-flex flex-wrap gap-x-[.45em] gap-y-[4px] ${className}`} aria-label={t}>
      {t.split(" ").map((word, wi) => (
        <span key={wi} className="inline-flex gap-[3px] whitespace-nowrap" aria-hidden="true">
          {[...word].map((c, i) => <FlapChar key={i} ch={c} />)}
        </span>
      ))}
    </span>
  );
}

const clip = (s, n = 16) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

export default function TripStatus() {
  const { ins, maybes, weekendLeader, totalVotes, tally, houses, favoriteId, lineup, status } = useTrip();
  const fav = houses.find((h) => h.id === favoriteId);
  const top = lineup[0];
  const ready = status === "ready";

  const rows = [
    { label: "LOCKED IN", value: pad(ins.length), remark: ins.length ? "BOARDING" : "GATE OPEN", tone: "text-[#7dff9b]" },
    { label: "MAYBES", value: pad(maybes.length), remark: maybes.length ? "DELAYED" : "NONE", tone: maybes.length ? "text-sunset" : "text-[#7dff9b]" },
    {
      label: "WEEKEND",
      value: weekendLeader ? `W${weekendLeader} LEADING` : totalVotes ? "TIED" : "NO VOTES",
      remark: weekendLeader ? `${tally[weekendLeader]} OF ${totalVotes}` : "VOTE NOW",
      tone: weekendLeader ? "text-[#7dff9b]" : "text-sunset",
    },
    { label: "CRIBS FOUND", value: pad(houses.length), remark: fav ? "FAVE PICKED" : houses.length ? "HEART ONE" : "SEARCHING", tone: "text-tape" },
    { label: "TOP ARTIST", value: top ? clip(top.name) : "TBA", remark: top ? `${top.votes} VOTE${top.votes === 1 ? "" : "S"}` : "PICK ONE", tone: "text-tape" },
    { label: "GC FAVORITE", value: fav ? clip(fav.nickname || fav.preview_title || "CRIB") : "TBD", remark: fav ? `${fav.hearts} HEART${fav.hearts === 1 ? "" : "S"}` : "—", tone: "text-tape" },
  ];

  const now = new Date();
  return (
    <section id="status" aria-labelledby="status-title" className="relative bg-ink text-paper border-t-[3px] border-ink py-20 sm:py-28 overflow-hidden">
      <div className="gutter relative mx-auto max-w-6xl">
        <SectionHead id="status-title" kicker="Departures · live from the group chat" tone="light" lines={["TRIP", <>STATUS <Script className="text-tape">board</Script></>]} />

        <div className="mt-10 bg-[#120a1a] border-[3px] border-[#3a2846] rounded-md p-3 sm:p-6 shadow-[0_0_0_6px_#22122e,0_0_0_9px_#3a2846]">
          <div className="flex flex-wrap items-center justify-between gap-2 pixel text-[10px] sm:text-xs text-tape border-b border-[#3a2846] pb-3">
            <span className="inline-flex items-center gap-2"><Plane className="w-4 h-4" aria-hidden="true" /> COACHELLA 2027 · INDIO</span>
            <span>{WEEKENDS[weekendLeader || 1].dates} · {ready ? `UPDATED ${pad(now.getHours())}:${pad(now.getMinutes())}` : "CONNECTING"}</span>
          </div>

          <dl className="divide-y divide-[#2a1c33]">
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[1fr_auto] sm:grid-cols-[170px_1fr_auto] items-center gap-x-4 gap-y-1.5 py-3.5">
                <dt className="pixel text-[10px] sm:text-xs text-paper/70 col-span-2 sm:col-span-1">{r.label}</dt>
                <dd className="text-[clamp(17px,5.2vw,30px)] min-w-0"><Flap text={ready ? r.value : "----"} /></dd>
                <dd className={`pixel text-[10px] sm:text-xs text-right ${r.tone}`}>{ready ? r.remark : ""}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="font-hand text-tape text-xl mt-5 -rotate-1">every number on this board is live. no spin.</p>
      </div>
    </section>
  );
}
