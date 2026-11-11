// GET /api/song?artist=Frank%20Ocean
// Finds a song by that artist on Apple Music (iTunes Search API, no key needed)
// and returns its 30-second preview clip.
const TIMEOUT_MS = 6000;

function json(body, status = 200, cache = "public, s-maxage=86400, stale-while-revalidate=604800") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

export function pickSong(results, artist) {
  const want = norm(artist);
  const playable = (results || []).filter((r) => r.previewUrl && r.kind === "song");
  if (!playable.length) return null;
  const exact = playable.filter((r) => norm(r.artistName) === want);
  const loose = playable.filter((r) => norm(r.artistName).includes(want) || want.includes(norm(r.artistName)));
  const r = exact[0] || loose[0] || null;
  if (!r) return null;
  return {
    artist: r.artistName,
    track: r.trackName,
    preview: r.previewUrl,
    artwork: r.artworkUrl100 ? r.artworkUrl100.replace(/\/\d+x\d+bb\./, "/300x300bb.") : null,
    link: r.trackViewUrl || null,
  };
}

export async function GET(request) {
  const artist = (new URL(request.url).searchParams.get("artist") || "").trim().slice(0, 80);
  if (!artist) return json({ error: "missing_artist" }, 400, "no-store");
  const params = new URLSearchParams({ term: artist, media: "music", entity: "song", attribute: "artistTerm", limit: "25", country: "US" });
  try {
    const res = await fetch(`https://itunes.apple.com/search?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return json({ song: null }, 200, "public, s-maxage=300");
    const data = await res.json();
    return json({ song: pickSong(data.results, artist) });
  } catch {
    return json({ song: null }, 200, "public, s-maxage=300");
  }
}
