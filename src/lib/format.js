export const pad = (n, w = 2) => String(n).padStart(w, "0");

export const money = (n) =>
  n == null ? null : "$" + Math.round(Number(n)).toLocaleString("en-US");

// "frank ocean" → "Frank Ocean" when nobody used capitals.
export function tidyName(s) {
  if (!s) return s;
  if (s !== s.toLowerCase()) return s;
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
