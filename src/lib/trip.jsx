import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isConfigured } from "./supabase";
import { deviceToken, savedMe, saveMe } from "./device";
import { tidyName } from "./format";

const TripContext = createContext(null);
export const useTrip = () => useContext(TripContext);

const EMPTY = { attendees: [], picks: [], weekendVotes: [], properties: [], propertyVotes: [] };

async function fetchAll() {
  const q = (table, cols) => supabase.from(table).select(cols).then(({ data, error }) => {
    if (error) throw error;
    return data || [];
  });
  const [attendees, picks, weekendVotes, properties, propertyVotes] = await Promise.all([
    q("attendees", "id,name,status,created_at,updated_at"),
    q("artist_picks", "attendee_id,artist,artist_key"),
    q("weekend_votes", "attendee_id,weekend"),
    q("properties", "id,url,nickname,est_total_price,guests,preview_title,preview_image,added_by,created_at"),
    q("property_votes", "property_id,attendee_id"),
  ]);
  return { attendees, picks, weekendVotes, properties, propertyVotes };
}

export function TripProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState(isConfigured ? "loading" : "offline");
  const [meId, setMeId] = useState(() => savedMe());
  const refetchTimer = useRef(0);
  const device = useMemo(() => deviceToken(), []);

  const refresh = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const next = await fetchAll();
      setData(next);
      setStatus("ready");
    } catch {
      setStatus((s) => (s === "ready" ? "ready" : "error"));
    }
  }, []);

  const soon = useCallback(() => {
    clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(refresh, 250);
  }, [refresh]);

  // First load, live updates, and a slow poll as a backup.
  useEffect(() => {
    if (!isConfigured) return;
    refresh();
    supabase.rpc("whoami", { p_device: device }).then(({ data: id, error }) => {
      if (error) return;
      setMeId(id || null);
      saveMe(id || null);
    });
    const channel = supabase
      .channel("gc27-live")
      .on("postgres_changes", { event: "*", schema: "public" }, soon)
      .subscribe();
    const poll = setInterval(() => document.visibilityState === "visible" && refresh(), 30000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [device, refresh, soon]);

  const call = useCallback(async (fn, args) => {
    if (!isConfigured) throw new Error("NOT_CONFIGURED");
    const { data: out, error } = await supabase.rpc(fn, { p_device: device, ...args });
    if (error) throw error;
    return out;
  }, [device]);

  // ── actions ──
  const join = useCallback(async ({ name, status: st, artist, claim = false }) => {
    const id = await call("join_trip", { p_name: name, p_status: st, p_artist: artist, p_claim: claim });
    setMeId(id);
    saveMe(id);
    await refresh();
    return id;
  }, [call, refresh]);

  const voteWeekend = useCallback(async (weekend) => {
    setData((d) => ({
      ...d,
      weekendVotes: [...d.weekendVotes.filter((v) => v.attendee_id !== meId), { attendee_id: meId, weekend }],
    }));
    try { await call("vote_weekend", { p_weekend: weekend }); }
    finally { refresh(); }
  }, [call, meId, refresh]);

  const addProperty = useCallback(async ({ url, nickname, price, guests, title, image }) => {
    const id = await call("add_property", {
      p_url: url, p_nickname: nickname || null, p_price: price ?? null, p_guests: guests ?? null,
      p_title: title || null, p_image: image || null,
    });
    await refresh();
    return id;
  }, [call, refresh]);

  const toggleHeart = useCallback(async (propertyId) => {
    setData((d) => {
      const has = d.propertyVotes.some((v) => v.property_id === propertyId && v.attendee_id === meId);
      return {
        ...d,
        propertyVotes: has
          ? d.propertyVotes.filter((v) => !(v.property_id === propertyId && v.attendee_id === meId))
          : [...d.propertyVotes, { property_id: propertyId, attendee_id: meId }],
      };
    });
    try { return await call("toggle_property_vote", { p_property: propertyId }); }
    finally { refresh(); }
  }, [call, meId, refresh]);

  const removeProperty = useCallback(async (propertyId) => {
    await call("remove_property", { p_property: propertyId });
    await refresh();
  }, [call, refresh]);

  // ── everything the sections read ──
  const derived = useMemo(() => {
    const attendees = [...data.attendees].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const passNo = new Map(attendees.map((a, i) => [a.id, i + 1]));
    const pickBy = new Map(data.picks.map((p) => [p.attendee_id, p]));
    const voteBy = new Map(data.weekendVotes.map((v) => [v.attendee_id, v.weekend]));
    const nameBy = new Map(attendees.map((a) => [a.id, a.name]));
    const people = attendees.map((a) => ({
      ...a,
      passNo: passNo.get(a.id),
      artist: pickBy.get(a.id)?.artist ? tidyName(pickBy.get(a.id).artist) : null,
      weekend: voteBy.get(a.id) || null,
    }));
    const me = people.find((p) => p.id === meId) || null;
    const ins = people.filter((p) => p.status === "in");
    const maybes = people.filter((p) => p.status !== "in");

    // Most wanted: merge picks by lowercased name.
    const groups = new Map();
    for (const p of data.picks) {
      if (!nameBy.has(p.attendee_id)) continue;
      const g = groups.get(p.artist_key) || { key: p.artist_key, spellings: new Map(), who: [] };
      g.spellings.set(p.artist, (g.spellings.get(p.artist) || 0) + 1);
      g.who.push(nameBy.get(p.attendee_id));
      groups.set(p.artist_key, g);
    }
    const lineup = [...groups.values()]
      .map((g) => {
        const best = [...g.spellings.entries()].sort((a, b) => b[1] - a[1] || (b[0] !== b[0].toLowerCase()) - (a[0] !== a[0].toLowerCase()))[0][0];
        return { key: g.key, name: tidyName(best), votes: g.who.length, who: g.who };
      })
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));

    // Weekend war
    const tally = { 1: 0, 2: 0 };
    for (const v of data.weekendVotes) if (nameBy.has(v.attendee_id)) tally[v.weekend]++;
    const totalVotes = tally[1] + tally[2];
    const weekendLeader = tally[1] === tally[2] ? null : tally[1] > tally[2] ? 1 : 2;

    // Houses
    const votesFor = new Map();
    for (const v of data.propertyVotes) {
      if (!votesFor.has(v.property_id)) votesFor.set(v.property_id, []);
      votesFor.get(v.property_id).push(v.attendee_id);
    }
    const houses = data.properties
      .map((h) => {
        const voters = votesFor.get(h.id) || [];
        return {
          ...h,
          hearts: voters.length,
          hearted: voters.includes(meId),
          heartedBy: voters.map((id) => nameBy.get(id)).filter(Boolean),
          addedByName: nameBy.get(h.added_by) || null,
          mine: Boolean(meId) && h.added_by === meId,
        };
      })
      .sort((a, b) => b.hearts - a.hearts || a.created_at.localeCompare(b.created_at));
    const top = houses[0];
    const favoriteId = top && top.hearts > 0 && (!houses[1] || houses[1].hearts < top.hearts) ? top.id : null;

    return { people, me, ins, maybes, lineup, tally, totalVotes, weekendLeader, houses, favoriteId };
  }, [data, meId]);

  const value = useMemo(
    () => ({ ...derived, status, isConfigured, refresh, join, voteWeekend, addProperty, toggleHeart, removeProperty }),
    [derived, status, refresh, join, voteWeekend, addProperty, toggleHeart, removeProperty]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
