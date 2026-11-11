// GET /api/preview?url=https://www.airbnb.com/rooms/123
// Fetches a listing page on the server and returns its title + preview image (Open Graph tags).
// Runs as a Vercel Function in production and through vite.config.js in `npm run dev`.
// Many listing sites block bots now and then, so the site treats a missing preview as normal.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 600_000;
const TIMEOUT_MS = 7000;

function json(body, status = 200, cache = "public, s-maxage=86400, stale-while-revalidate=604800") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

// Block requests to private or local addresses.
function isPrivate(ip) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivate(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublic(url) {
  if (!/^https?:$/.test(url.protocol)) throw new Error("bad protocol");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("blocked host");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivate(a.address))) throw new Error("blocked address");
}

async function readCapped(res) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ").trim();

function meta(html, keys) {
  for (const key of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, "i");
    const m = html.match(re1) || html.match(re2);
    if (m) return decode(m[1]);
  }
  return null;
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("url") || "";
  let target;
  try {
    target = new URL(raw);
  } catch {
    return json({ error: "bad_url" }, 400, "no-store");
  }

  try {
    let res;
    for (let hop = 0; hop < 4; hop++) {
      await assertPublic(target);
      res = await fetch(target, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; GroupTripPreview/1.0; +link-preview)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en-US,en;q=0.8",
        },
      });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) { target = new URL(loc, target); continue; }
      break;
    }
    if (!res || !res.ok || !(res.headers.get("content-type") || "").includes("html")) {
      return json({ title: null, image: null }, 200, "public, s-maxage=600");
    }
    const html = await readCapped(res);
    let title = meta(html, ["og:title", "twitter:title"]) || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ? decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)[1]) : null);
    let image = meta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
    if (image) {
      try { image = new URL(image, target).href; } catch { image = null; }
      if (image && !image.startsWith("https://")) image = null;
    }
    if (title) title = title.slice(0, 200);
    return json({ title: title || null, image: image || null });
  } catch {
    return json({ title: null, image: null }, 200, "public, s-maxage=600");
  }
}
