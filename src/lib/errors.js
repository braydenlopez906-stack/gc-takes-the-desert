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
  if (/fetch|network|Failed/i.test(err?.message || "")) return "Couldn't reach the server. Check your signal and try again.";
  return "Something went wrong. Try again.";
}
