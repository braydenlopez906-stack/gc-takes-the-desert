import { createClient } from "@supabase/supabase-js";

// Accept values pasted as a whole line from Supabase's setup snippet,
// e.g. NEXT_PUBLIC_SUPABASE_URL=https://abcd.supabase.co or KEY="sb_publishable_…".
const clean = (v) =>
  String(v || "")
    .trim()
    .replace(/^export\s+/i, "")
    .replace(/^[A-Z][A-Z0-9_]*\s*=\s*/i, "")
    .replace(/^["'`]|["'`;]$/g, "")
    .trim();

const rawUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Explains a bad setting on the page instead of crashing the whole site.
function check() {
  if (!rawUrl && !key) return "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing.";
  if (!rawUrl) return "VITE_SUPABASE_URL is missing.";
  if (!key) return "VITE_SUPABASE_ANON_KEY is missing.";
  if (/^sb_(publishable|secret)_|^eyJ/.test(rawUrl)) return "VITE_SUPABASE_URL contains a key. It should be your Project URL, like https://abcd1234.supabase.co, and the key goes in VITE_SUPABASE_ANON_KEY.";
  if (/^sb_secret_/.test(key)) return "VITE_SUPABASE_ANON_KEY is your SECRET key. Use the publishable (sb_publishable_…) or anon public key instead, and keep the secret one private.";
  return null;
}

// Accept "abcd.supabase.co" or a URL with a trailing path by normalizing it.
function normalize(u) {
  let v = u.replace(/\/+$/, "");
  if (v && !/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const parsed = new URL(v);
    return parsed.origin;
  } catch {
    return null;
  }
}

let client = null;
let problem = check();
if (!problem) {
  const url = normalize(rawUrl);
  const host = url ? new URL(url).hostname : "";
  if (!url) problem = `VITE_SUPABASE_URL ("${rawUrl.slice(0, 60)}") isn't a web address. It should look like https://abcd1234.supabase.co.`;
  else if (/(^|\.)supabase\.com$/.test(host)) problem = `VITE_SUPABASE_URL is the Supabase dashboard link (${rawUrl.slice(0, 80)}). Use the Project URL instead, which looks like https://abcd1234.supabase.co (Supabase → Connect, or Project Settings → Data API).`;
  else if (!/\.supabase\.co$/.test(host) && !/^(localhost|127\.0\.0\.1)$/.test(host)) problem = `VITE_SUPABASE_URL is ${url}, which isn't a Supabase project address. It should end in .supabase.co.`;
  else {
    try {
      client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    } catch (e) {
      problem = `Couldn't connect to Supabase: ${e.message}`;
    }
  }
}

export const isConfigured = Boolean(client);
export const configProblem = problem;
export const supabase = client;
export const supabaseHost = client ? new URL(normalize(rawUrl)).hostname : "";
