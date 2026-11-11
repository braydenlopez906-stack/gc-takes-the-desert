import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BedDouble, Heart, Link2, Loader2, Plus, Trash2, Trophy } from "lucide-react";
import { useTrip } from "../lib/trip";
import { errorMessage } from "../lib/errors";
import { hash, hostOf, money } from "../lib/format";
import Scene from "./Scene";
import { Hand, SectionHead, Script, confettiFrom, stamp, useToast } from "./ui";

async function fetchPreview(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return {};
    const data = await res.json();
    return { title: data.title || null, image: data.image || null };
  } catch {
    return {};
  }
}

export default function TheCrib() {
  const { houses, favoriteId, status } = useTrip();
  const reduce = useReducedMotion();

  return (
    <section id="crib" aria-labelledby="crib-title" className="relative bg-[#ffd6c2] border-t-[3px] border-ink py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(45deg,transparent_0_22px,rgba(255,106,26,.18)_22px_24px)]" aria-hidden="true" />
      <div className="gutter relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead id="crib-title" kicker={`Desert real estate · ${houses.length} found`} lines={["AIR", <>BNB <Script className="text-sunset">hunt</Script></>]} />
          <Hand className="text-cobalt text-2xl max-w-[24ch]">paste a link. heart the ones you'd actually sleep in.</Hand>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
          <AddHouse />

          <div>
            {houses.length === 0 ? (
              <div className="border-[3px] border-dashed border-ink/45 p-8 text-center bg-paper/40">
                <p className="poster text-[60px] text-ink/20">NO CRIB</p>
                <p className="font-hand text-2xl mt-1">{status === "ready" ? "Nobody's found a place yet. Paste the first Airbnb." : "Loading houses…"}</p>
              </div>
            ) : (
              <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2" aria-label="Houses">
                <AnimatePresence initial={false}>
                  {houses.map((h, i) => (
                    <motion.li key={h.id} layout={!reduce} initial={{ opacity: 0, y: 40, rotate: 6 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.85 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
                      <HouseCard house={h} index={i} favorite={h.id === favoriteId} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AddHouse() {
  const { me, addProperty, isConfigured } = useTrip();
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [nickname, setNickname] = useState("");
  const [price, setPrice] = useState("");
  const [guests, setGuests] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | preview | saving
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    let link = url.trim();
    if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;
    try { new URL(link); } catch { return setError("Paste the full listing link, like https://www.airbnb.com/rooms/…"); }
    const p = price.trim() ? Number(price.replace(/[$,\s]/g, "")) : null;
    if (p != null && (!Number.isFinite(p) || p < 0)) return setError("Price should be a number, like 4200.");
    const g = guests.trim() ? parseInt(guests, 10) : null;
    if (g != null && (!Number.isInteger(g) || g < 1 || g > 50)) return setError("Guests should be between 1 and 50.");

    setPhase("preview");
    const preview = await fetchPreview(link);
    setPhase("saving");
    try {
      await addProperty({ url: link, nickname: nickname.trim(), price: p, guests: g, title: preview.title, image: preview.image });
      toast(preview.title ? "House added, with its listing preview." : "House added.", "pink");
      setUrl(""); setNickname(""); setPrice(""); setGuests("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPhase("idle");
    }
  }

  const locked = !isConfigured || !me;

  return (
    <form onSubmit={submit} noValidate className="relative bg-paper border-[3px] border-ink shadow-[10px_10px_0_#2a3cff] p-5 pt-7 -rotate-1 lg:sticky lg:top-6">
      <span className="tape -top-3 left-8 -rotate-6" aria-hidden="true" />
      <p className="pixel text-[11px] text-pink">FOUND A PLACE?</p>
      <h3 className="poster-wide text-3xl mt-1">Add a crib</h3>

      {locked ? (
        <div className="mt-4">
          <p className="text-[15px]">{isConfigured ? "Get your pass first so the group knows who found it." : "The database isn't connected yet."}</p>
          {isConfigured && <a href="#join" className="press inline-block mt-4 bg-pink text-paper px-4 py-2 poster-wide text-lg">Get my pass</a>}
        </div>
      ) : (
        <>
          <label htmlFor="house-url" className="block mt-4 pixel text-[10px]">AIRBNB / LODGING LINK</label>
          <div className="flex items-center gap-2 mt-1.5 border-b-[3px] border-ink focus-within:border-pink">
            <Link2 className="w-5 h-5 shrink-0 text-dusk" aria-hidden="true" />
            <input id="house-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://airbnb.com/rooms/…"
              className="w-full min-w-0 bg-transparent outline-none py-2 text-[16px]" autoComplete="off" />
          </div>

          <label htmlFor="house-nick" className="block mt-4 pixel text-[10px]">NICKNAME <span className="text-dusk">(OPTIONAL)</span></label>
          <input id="house-nick" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={40} placeholder="the pink pool house"
            className="w-full bg-transparent border-b-[3px] border-ink focus:border-pink outline-none py-1 font-hand text-[26px]" />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="house-price" className="block pixel text-[10px]">TOTAL PRICE $</label>
              <input id="house-price" type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="4200"
                className="w-full bg-transparent border-b-[3px] border-ink focus:border-pink outline-none py-1 poster-wide text-2xl" />
            </div>
            <div>
              <label htmlFor="house-guests" className="block pixel text-[10px]">SLEEPS</label>
              <input id="house-guests" type="text" inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="10"
                className="w-full bg-transparent border-b-[3px] border-ink focus:border-pink outline-none py-1 poster-wide text-2xl" />
            </div>
          </div>

          <button type="submit" disabled={phase !== "idle" || !url.trim()} className="press mt-6 w-full bg-ink text-tape py-3 poster-wide text-xl inline-flex items-center justify-center gap-2 shadow-[5px_5px_0_#ff3a87]">
            {phase === "idle" ? <><Plus className="w-5 h-5" aria-hidden="true" /> Add to the list</> : <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> {phase === "preview" ? "Grabbing the listing…" : "Saving…"}</>}
          </button>
          <p role="status" aria-live="polite" className="font-hand text-lg text-[#c2002f] min-h-[1.3em] mt-2 leading-tight">{error}</p>
        </>
      )}
    </form>
  );
}

function HouseCard({ house, index, favorite }) {
  const { me, toggleHeart, removeProperty } = useTrip();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [imgOk, setImgOk] = useState(Boolean(house.preview_image));
  const [confirming, setConfirming] = useState(false);
  const tilt = ((hash(house.id) % 7) - 3) * 0.8;
  const title = house.nickname || house.preview_title || `Crib Nº ${index + 1}`;
  const perPerson = house.est_total_price != null && house.guests ? house.est_total_price / house.guests : null;

  async function heart(e) {
    if (!me) { toast("Grab your pass first to heart houses.", "error"); return; }
    const el = e.currentTarget;
    if (!house.hearted) confettiFrom(el, 30);
    try { await toggleHeart(house.id); } catch (err) { toast(errorMessage(err), "error"); }
  }

  async function remove() {
    try { await removeProperty(house.id); toast("House removed."); } catch (err) { toast(errorMessage(err), "error"); setConfirming(false); }
  }

  return (
    <motion.article whileHover={reduce ? undefined : { rotate: 0, y: -4 }} style={{ rotate: tilt }}
      className={`relative bg-paper border-[3px] border-ink p-2.5 pb-4 ${favorite ? "shadow-[10px_10px_0_#ff3a87]" : "shadow-hard"}`}>
      {favorite && (
        <motion.div initial={reduce ? false : { scale: 2.2, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: -10, opacity: 1 }} transition={stamp}
          className="absolute -left-3 -top-4 z-10 bg-pink text-paper border-[3px] border-ink px-2.5 py-1 poster-wide text-lg inline-flex items-center gap-1.5 shadow-[4px_4px_0_#22122e]">
          <Trophy className="w-4 h-4" aria-hidden="true" /> GC FAVORITE
        </motion.div>
      )}

      <div className="relative overflow-hidden border-2 border-ink">
        {imgOk ? (
          <img src={house.preview_image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgOk(false)}
            className="block w-full aspect-[4/3] object-cover" />
        ) : (
          <div className="aspect-[4/3] overflow-hidden"><Scene scene="house" seed={hash(house.id)} className="!aspect-[4/3] object-cover" /></div>
        )}
        <span className="absolute left-2 bottom-2 pixel text-[9px] bg-ink text-paper px-1.5 py-0.5">{hostOf(house.url) || "LISTING"}</span>
        {house.est_total_price != null && (
          <span className="absolute right-2 top-2 bg-tape text-ink border-2 border-ink px-2 py-0.5 rotate-6 poster-wide text-lg [clip-path:polygon(8%_0,100%_0,100%_100%,8%_100%,0_50%)] pl-4">
            {money(house.est_total_price)}
          </span>
        )}
      </div>

      <div className="px-1.5 pt-3">
        <h3 className="poster-wide text-[26px] leading-[.95] [overflow-wrap:anywhere]">{title}</h3>
        {house.nickname && house.preview_title && <p className="text-sm text-dusk mt-1 line-clamp-2">{house.preview_title}</p>}

        <dl className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pixel text-[10px]">
          {house.guests && <div className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" aria-hidden="true" /><dt className="sr-only">Sleeps</dt><dd>SLEEPS {house.guests}</dd></div>}
          {house.est_total_price != null && <div><dt className="sr-only">Total</dt><dd>{money(house.est_total_price)} TOTAL</dd></div>}
          {perPerson != null && <div className="text-pink"><dt className="sr-only">Per person</dt><dd>≈ {money(perPerson)}/PERSON</dd></div>}
        </dl>
        {house.addedByName && <p className="font-hand text-lg mt-2 text-dusk">found by {house.addedByName}</p>}

        <div className="flex items-center gap-2.5 mt-4">
          <motion.button type="button" onClick={heart} whileTap={reduce ? undefined : { scale: 0.85 }}
            aria-pressed={house.hearted} aria-label={`${house.hearted ? "Remove your heart from" : "Heart"} ${title}. ${house.hearts} hearts.`}
            className={`press inline-flex items-center gap-1.5 px-3 py-2 poster-wide text-lg !shadow-[3px_3px_0_#22122e] ${house.hearted ? "bg-pink text-paper" : "bg-paper"}`}>
            <motion.span key={String(house.hearted)} initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 12 }}>
              <Heart className="w-5 h-5" fill={house.hearted ? "currentColor" : "none"} strokeWidth={2.5} aria-hidden="true" />
            </motion.span>
            <span className="tabular-nums">{house.hearts}</span>
          </motion.button>
          <a href={house.url} target="_blank" rel="noopener noreferrer"
            className="press flex-1 inline-flex items-center justify-center gap-1.5 bg-ink text-tape px-3 py-2 poster-wide text-lg !shadow-[3px_3px_0_#ff6a1a]">
            VIEW HOUSE <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
        {house.heartedBy.length > 0 && <p className="text-xs text-dusk mt-2.5"><Heart className="inline w-3 h-3 -mt-0.5" fill="currentColor" aria-hidden="true" /> {house.heartedBy.join(", ")}</p>}

        {house.mine && (
          <div className="mt-3 text-sm">
            {confirming ? (
              <span className="inline-flex items-center gap-3">
                <span>Remove this house?</span>
                <button type="button" onClick={remove} className="font-bold text-[#c2002f] underline">Yes, remove</button>
                <button type="button" onClick={() => setConfirming(false)} className="underline">Keep it</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1 text-dusk hover:text-[#c2002f]">
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> remove
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
