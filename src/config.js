// ─────────────────────────────────────────────────────────────
//  TRIP SETTINGS · edit these, everything else updates itself
// ─────────────────────────────────────────────────────────────

// Official dates (announced by Goldenvoice, April 2026): Apr 9–11 and Apr 16–18, 2027.
// The countdown runs to the Friday of whichever weekend is winning the Weekend War.
// Gate times aren't published yet; noon Pacific is a placeholder you can change.
export const WEEKENDS = {
  1: { label: "WEEKEND 1", dates: "APR 9–11", start: "2027-04-09T12:00:00-07:00" },
  2: { label: "WEEKEND 2", dates: "APR 16–18", start: "2027-04-16T12:00:00-07:00" },
};

// Set to 1 or 2 to lock the countdown to one weekend once the group decides.
// Leave as null to follow the Weekend War leader.
export const COUNTDOWN_WEEKEND = null;

// Scrapbook frames. With no `src`, each frame is a drawn "disposable camera" scene.
// To use your own photos: put them in /public/memories/ and set src: "/memories/your-photo.jpg".
export const MEMORIES = [
  { scene: "palms", caption: "we're actually doing this", stamp: "'27 4 09" },
  { scene: "wheel", caption: "meet @ the ferris wheel", stamp: "'27 4 09" },
  { scene: "road", caption: "the drive in. aux privileges revoked", stamp: "'27 4 09" },
  { scene: "crowd", caption: "see you in the desert", stamp: "'27 4 10" },
  { scene: "wristband", caption: "GC field trip", stamp: "'27 4 10" },
  { scene: "party", caption: "afters at the airbnb", stamp: "'27 4 10" },
  { scene: "sunset", caption: "bad financial decisions → great memories", stamp: "'27 4 11" },
  { scene: "tent", caption: "front left. always.", stamp: "'27 4 11" },
];
