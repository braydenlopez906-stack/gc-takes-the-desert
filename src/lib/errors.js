import { supabaseHost } from "./supabase";
// Turns database error codes into plain sentences.
const MESSAGES = {
  NAME_TAKEN: "That name's already on the roster.",
  NOT_JOINED: "Grab your pass first. It takes ten seconds.",
  DUPLICATE_PROPERTY: "Someone already added that place.",
  BAD_URL: "That link doesn't look right. Paste the full https:// link.",
  BAD_NAME: "Your name needs 1 to 24 characters.",
  BAD_ARTIST: "Name one artist (up to 40 characters).",
  BAD_PRICE: "The price should be a number, like 4200.",
  BAD_GUESTS: "Guests should be between 1 and 50.",
  ROSTER_FULL: "The roster is full.",
  TOO_MANY_PROPERTIES: "That's 100 houses. Delete a few before adding more.",
  NOT_YOURS: "Only the person who added a house can remove it.",
  NO_PROPERTY: "That house was removed.",
};

export function errorCode(err) {
  const text = `${err?.message || ""} ${err?.details || ""}`;
  return Object.keys(MESSAGES).find((k) => text.includes(k)) || null;
}

export function errorMessage(err) {
  const code = errorCode(err);
  if (code) return MESSAGES[code];
  if (/fetch|network|Failed|Load failed/i.test(err?.message || "")) {
    return navigator.onLine === false
      ? "You're offline. Check your signal and try again."
      : `Couldn't reach the database at ${supabaseHost || "(no address)"}. If that address looks wrong, fix VITE_SUPABASE_URL in Vercel and redeploy. If it looks right, the Supabase project may be paused.`;
  }
  if (/Could not find the function|schema cache|does not exist|PGRST202/i.test(`${err?.message} ${err?.code}`)) {
    return "The database is reachable but isn't set up yet. Run supabase/schema.sql in the Supabase SQL Editor.";
  }
  if (/Invalid API key|JWT|apikey|401/i.test(`${err?.message} ${err?.code}`)) {
    return "Supabase rejected the key. Check VITE_SUPABASE_ANON_KEY in Vercel (use the publishable or anon key) and redeploy.";
  }
  return `Something went wrong: ${err?.message || "unknown error"}`;
}
