import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, HelpCircle, Pencil, Printer } from "lucide-react";
import { useTrip } from "../lib/trip";
import { configProblem } from "../lib/supabase";
import { errorCode, errorMessage } from "../lib/errors";
import PassCard from "./PassCard";
import { Hand, SectionHead, Script, confettiFrom, stamp, useToast } from "./ui";

export default function JoinDesk() {
  const { me, isConfigured } = useTrip();
  const [editing, setEditing] = useState(false);
  const [justPrinted, setJustPrinted] = useState(false);
  const showForm = !me || editing;

  return (
    <section id="join" aria-labelledby="join-title" className="relative bg-ink text-paper py-20 sm:py-28 overflow-hidden scroll-mt-4">
      <div className="absolute inset-0 dots opacity-60 pointer-events-none" aria-hidden="true" />
      <div className="gutter relative mx-auto max-w-6xl grid gap-10 md:grid-cols-[.9fr_1.1fr] md:items-start">
        <div>
          <SectionHead id="join-title" kicker="Credential desk · step up" tone="light" lines={["GET YOUR", <>PASS <Script className="text-tape">now</Script></>]} />
          <p className="mt-5 max-w-[36ch] text-[17px] text-[#e8d9c8]">
            Three questions. Your pass prints straight onto the roster, where the whole group can see it. No account, no password. This phone remembers you.
          </p>
          <Hand className="mt-5 text-tape text-[26px]">no more "maybe" texts. just lock in.</Hand>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {showForm ? (
              <motion.div key="form" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.35 }}>
                {isConfigured ? (
                  <PassForm
                    me={me}
                    onDone={() => { setEditing(false); setJustPrinted(true); }}
                    onCancel={me ? () => setEditing(false) : null}
                  />
                ) : (
                  <Offline />
                )}
              </motion.div>
            ) : (
              <motion.div key="pass" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.35 }}
                className="flex flex-col items-center gap-6">
                <p className="pixel text-tape text-xs">YOUR PASS · VALID ALL WEEKEND</p>
                <PassCard person={me} isMe={false} fresh={justPrinted} swing={false} />
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  <button type="button" onClick={() => setEditing(true)} className="press bg-paper text-ink px-4 py-2.5 poster-wide text-lg inline-flex items-center gap-2 shadow-[5px_5px_0_#ff3a87]">
                    <Pencil className="w-4 h-4" aria-hidden="true" /> Edit my pass
                  </button>
                  <a href="#weekend" className="press bg-tape text-ink px-4 py-2.5 poster-wide text-lg inline-flex items-center gap-2 shadow-[5px_5px_0_#ff3a87]">
                    Vote your weekend <ArrowDown className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Offline() {
  return (
    <div className="bg-paper text-ink border-[3px] border-ink p-6 shadow-[12px_12px_0_#ff3a87] rotate-1">
      <p className="pixel text-xs text-pink">DATABASE NOT CONNECTED</p>
      <p className="mt-3">The roster needs its database before anyone can join.</p>
      {configProblem && <p className="mt-3 font-semibold">{configProblem}</p>}
      <p className="mt-3 text-sm">Fix it in Vercel → Settings → Environment Variables, then Deployments → ⋯ → Redeploy.</p>
    </div>
  );
}

function PassForm({ me, onDone, onCancel }) {
  const { join, lineup } = useTrip();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [name, setName] = useState(me?.name || "");
  const [status, setStatus] = useState(me?.status || "");
  const [artist, setArtist] = useState(me?.artist || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nameTaken, setNameTaken] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => { setNameTaken(false); }, [name]);

  async function submit(e, claim = false) {
    e?.preventDefault();
    setError("");
    const n = name.trim(), a = artist.trim();
    if (!n) return setError("Your pass needs a name."), document.getElementById("join-name")?.focus();
    if (!status) return setError("Pick one: lock me in, or still deciding.");
    if (!a) return setError("Name one artist. Just one."), document.getElementById("join-artist")?.focus();
    setBusy(true);
    try {
      await join({ name: n, status, artist: a, claim });
      if (status === "in") { confettiFrom(btnRef.current, 140); toast(`Locked in, ${n}. See you in Indio.`, "pink"); }
      else toast(`Your pass is on the wall, ${n}. Lock in when you're ready.`);
      onDone();
    } catch (err) {
      if (errorCode(err) === "NAME_TAKEN") setNameTaken(true);
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate
      className="relative bg-paper text-ink rounded-t-2xl rounded-b-md px-5 sm:px-9 pt-9 pb-7 shadow-[12px_12px_0_#ff3a87] md:rotate-1 focus-within:rotate-0 transition-transform">
      <span aria-hidden="true" className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-ink" />
      <div className="flex flex-wrap justify-between gap-2 pixel text-[10px] sm:text-[11px] border-b-2 border-ink pb-2.5">
        <span>ARTIST / GUEST / GC</span><span>{me ? "EDITING PASS" : "ALL ACCESS · 2027"}</span>
      </div>

      <Field n="01" label="What's your name?" htmlFor="join-name">
        <input id="join-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoComplete="given-name"
          placeholder="the name on your pass"
          className="w-full mt-2 bg-transparent border-0 border-b-[3px] border-ink focus:border-pink outline-none font-hand text-[32px] leading-tight px-0.5 py-1 placeholder:text-[#b9a58f]" />
      </Field>

      <AnimatePresence>
        {nameTaken && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 border-[3px] border-ink bg-tape p-3.5" role="alert">
              <p className="font-semibold">There's already a pass for “{name.trim()}”. Is that you on a new phone?</p>
              <div className="flex flex-wrap gap-2.5 mt-3">
                <button type="button" onClick={() => submit(null, true)} disabled={busy} className="press bg-ink text-tape px-3 py-1.5 poster-wide text-base shadow-[4px_4px_0_#ff3a87]">That's me, use that pass</button>
                <button type="button" onClick={() => { setNameTaken(false); document.getElementById("join-name")?.focus(); }} className="underline font-semibold">No, I'll add my last initial</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <fieldset className="mt-6">
        <legend className="flex gap-2.5 items-baseline poster-wide text-[21px] leading-tight">
          <span className="pixel text-[11px] bg-cobalt text-paper px-1.5 py-0.5 -translate-y-0.5">02</span>Are you in for Coachella 2027?
        </legend>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mt-3">
          <Choice id="st-in" checked={status === "in"} onChange={() => setStatus("in")} tone="in"
            icon={<Check className="w-5 h-5" strokeWidth={3} />} title="Lock me in" sub="I'm going. Book it." />
          <Choice id="st-maybe" checked={status === "maybe"} onChange={() => setStatus("maybe")} tone="maybe"
            icon={<HelpCircle className="w-5 h-5" />} title="I'm still deciding" sub="convince me (please)" />
        </div>
      </fieldset>

      <Field n="03" label="Who are you most excited to see?" htmlFor="join-artist">
        <input id="join-artist" type="text" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={40}
          placeholder="one artist. choose wisely."
          className="w-full mt-2 bg-transparent border-0 border-b-[3px] border-ink focus:border-pink outline-none font-hand text-[32px] leading-tight px-0.5 py-1 placeholder:text-[#b9a58f]" />
        {lineup.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3" aria-label="Artists the group already picked">
            {lineup.slice(0, 6).map((g) => (
              <button key={g.key} type="button" onClick={() => setArtist(g.name)}
                className="border-2 border-ink px-2.5 py-1 pixel text-[10px] hover:bg-tape active:translate-y-0.5 transition">+ {g.name}</button>
            ))}
          </div>
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-4 mt-8">
        <button ref={btnRef} type="submit" disabled={busy}
          className="press bg-ink text-tape px-6 py-3.5 poster-wide text-[22px] inline-flex items-center gap-2.5 shadow-[5px_5px_0_#2a3cff]">
          <Printer className="w-5 h-5" aria-hidden="true" />
          {busy ? "Printing…" : me ? "Update my pass" : "Print my pass"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="underline font-semibold">Cancel</button>}
      </div>
      <p role="status" aria-live="polite" className="font-hand text-[21px] text-[#c2002f] min-h-[1.4em] mt-3">{error}</p>
      <div className="barcode h-8 mt-2 opacity-85" aria-hidden="true" />
    </form>
  );
}

function Field({ n, label, htmlFor, children }) {
  return (
    <div className="mt-6">
      <label htmlFor={htmlFor} className="flex gap-2.5 items-baseline poster-wide text-[21px] leading-tight">
        <span className="pixel text-[11px] bg-cobalt text-paper px-1.5 py-0.5 -translate-y-0.5">{n}</span>{label}
      </label>
      {children}
    </div>
  );
}

function Choice({ id, checked, onChange, tone, icon, title, sub }) {
  const reduce = useReducedMotion();
  const on = tone === "in" ? "bg-pink text-paper" : "bg-sage text-ink";
  return (
    <div className="relative">
      <input id={id} type="radio" name="join-status" checked={checked} onChange={onChange} className="peer sr-only" />
      <motion.label
        htmlFor={id}
        animate={{ rotate: checked ? (tone === "in" ? -2 : 1.5) : 0, scale: checked ? 1.02 : 1 }}
        transition={reduce ? { duration: 0 } : stamp}
        className={`flex flex-col gap-1 min-h-[88px] justify-center px-4 py-3 border-[3px] border-ink cursor-pointer select-none peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-dashed peer-focus-visible:outline-cobalt peer-focus-visible:outline-offset-2 ${checked ? `${on} shadow-hard` : "bg-paper hover:bg-white"}`}
      >
        <span className="flex items-center gap-2 poster-wide text-[23px] leading-none">{icon}{title}</span>
        <span className={`font-hand text-lg ${checked ? "" : "text-dusk"}`}>{sub}</span>
      </motion.label>
    </div>
  );
}
