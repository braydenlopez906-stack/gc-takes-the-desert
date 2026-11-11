/*
  DESIGN SYSTEM · "GC TAKES THE DESERT"
  Concept   A festival zine found in the glovebox. Every section is a different printed object
            from the trip: a laminated pass, a music-mag chart page, a fight poster, real-estate
            polaroids, an airport departure board, a billboard countdown, a scrapbook.
  Color     sun-bleached sand + paper, deep purple ink, hot pink, cobalt, sunset orange, tape yellow.
  Type      Archivo (condensed 900 for poster headlines, regular for body), Shrikhand (retro script
            accents), Silkscreen (Y2K pixel labels + data), Caveat Brush (handwritten notes).
  Motion    "stamp, drop, swing": springy overshoot, things land like rubber stamps, passes swing
            on lanyards, buttons press into their shadow, numbers roll.
  Layout    mobile-first single column collage of tilted, overlapping objects; desktop opens into
            asymmetric two-column spreads.
*/
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f0cf9f",
        dune: "#e7bb80",
        paper: "#fbf1df",
        ink: "#22122e",
        dusk: "#5b4566",
        pink: "#ff3a87",
        cobalt: "#2a3cff",
        sunset: "#ff6a1a",
        tape: "#ffe14a",
        sage: "#9db08a",
      },
      fontFamily: {
        display: ['"Archivo"', '"Arial Narrow"', "Impact", "sans-serif"],
        body: ['"Archivo"', "system-ui", "-apple-system", "sans-serif"],
        script: ['"Shrikhand"', '"Cooper Black"', "Georgia", "serif"],
        pixel: ['"Silkscreen"', "ui-monospace", '"Courier New"', "monospace"],
        hand: ['"Caveat Brush"', '"Marker Felt"', "cursive"],
      },
      boxShadow: {
        hard: "5px 5px 0 #22122e",
        "hard-lg": "8px 8px 0 #22122e",
        "hard-pink": "8px 8px 0 #ff3a87",
      },
    },
  },
  plugins: [],
};
