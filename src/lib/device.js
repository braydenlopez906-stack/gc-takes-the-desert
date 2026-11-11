// A random token that ties this phone to one pass. No accounts.
const KEY = "gc27.device";
const ME = "gc27.me";
let memoryToken = null;

function store(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }
function read(k) { try { return localStorage.getItem(k); } catch { return null; } }

function randomToken() {
  if (crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
  const a = new Uint8Array(20);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function deviceToken() {
  let t = read(KEY) || memoryToken;
  if (!t) { t = randomToken(); store(KEY, t); }
  memoryToken = t;
  return t;
}
export const savedMe = () => read(ME);
export const saveMe = (id) => store(ME, id);
