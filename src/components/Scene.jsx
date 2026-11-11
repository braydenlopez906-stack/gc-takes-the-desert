import { useEffect, useRef } from "react";

/*
  Drawn "disposable camera" prints. No stock or festival photography:
  every scene is painted on a canvas, then gets flash falloff, grain and an orange date stamp.
*/

const W = 320, H = 400;

function rng(seed) {
  let s = (seed % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function sky(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function palm(ctx, x, y, h, lean = 14) {
  ctx.strokeStyle = ctx.fillStyle = "#140a1c";
  ctx.lineCap = "round";
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean, y - h * 0.5, x + lean * 0.4, y - h); ctx.stroke();
  const tx = x + lean * 0.4, ty = y - h;
  ctx.lineWidth = 5;
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI + (i / 7) * Math.PI, L = 46 + (i % 2) * 10;
    ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 14, tx + Math.cos(a) * L, ty + Math.sin(a) * L * 0.35 + 22);
    ctx.stroke();
  }
}

function mountains(ctx, r, y, color, amp = 22) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y - Math.sin(x / 40 + r() * 0.4) * amp - r() * 12);
  ctx.lineTo(W, H); ctx.fill();
}

function crowd(ctx, r, y, n = 40, color = "#08040f") {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = r() * W, yy = y + r() * 40, s = 10 + r() * 7;
    ctx.beginPath(); ctx.arc(x, yy, s, 0, 7); ctx.fill();
    ctx.fillRect(x - s - 2, yy + s * 0.6, s * 2 + 4, H);
  }
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const x = r() * W;
    ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x + (r() - 0.5) * 30, y - 40 - r() * 20); ctx.stroke();
  }
}

function wheel(ctx, cx, cy, R) {
  ctx.strokeStyle = "rgba(255,240,200,.9)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.25, 0, 7); ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    ctx.fillStyle = ["#ff3a87", "#ffe14a", "#7df9ff", "#ff6a1a"][i % 4];
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 8, 0, 7); ctx.fill();
  }
  ctx.beginPath(); ctx.moveTo(cx - R * 0.5, H); ctx.lineTo(cx, cy); ctx.lineTo(cx + R * 0.5, H); ctx.stroke();
}

const SCENES = {
  palms(ctx, r) {
    sky(ctx, [[0, "#3b2a6b"], [0.45, "#ff5e7e"], [0.72, "#ffb34a"]]);
    ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.arc(W * 0.6, H * 0.6, 56, 0, 7); ctx.fill();
    mountains(ctx, r, H * 0.62, "#6b2f6a");
    ctx.fillStyle = "#2a1530"; ctx.fillRect(0, H * 0.75, W, H);
    palm(ctx, W * 0.16, H * 0.8, 190); palm(ctx, W * 0.84, H * 0.82, 150, -12); palm(ctx, W * 0.7, H * 0.84, 110);
  },
  wheel(ctx, r) {
    sky(ctx, [[0, "#1b1446"], [0.6, "#8e3c8c"], [0.88, "#ff7a3d"]]);
    wheel(ctx, W * 0.52, H * 0.46, 118);
    ctx.fillStyle = "#120a22"; ctx.fillRect(0, H * 0.86, W, H);
    crowd(ctx, r, H * 0.86, 26, "#120a22");
  },
  road(ctx, r) {
    sky(ctx, [[0, "#ff9a5c"], [0.4, "#ffcf7a"], [0.55, "#ffe3a8"]]);
    mountains(ctx, r, H * 0.5, "#b5627a", 16);
    ctx.fillStyle = "#c78b5a"; ctx.fillRect(0, H * 0.52, W, H);
    ctx.fillStyle = "#3a2a33";
    ctx.beginPath(); ctx.moveTo(W * 0.47, H * 0.52); ctx.lineTo(W * 0.53, H * 0.52); ctx.lineTo(W * 0.95, H); ctx.lineTo(W * 0.05, H); ctx.fill();
    ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 4; ctx.setLineDash([22, 18]);
    ctx.beginPath(); ctx.moveTo(W / 2, H * 0.53); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    // dashboard + hand out the window
    ctx.fillStyle = "#1c1020"; ctx.fillRect(0, H * 0.86, W, H);
    ctx.beginPath(); ctx.ellipse(W * 0.82, H * 0.84, 34, 16, -0.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#ff3a87"; ctx.fillRect(18, H * 0.89, 70, 10);
    palm(ctx, W * 0.1, H * 0.62, 70); palm(ctx, W * 0.9, H * 0.6, 60, -8);
  },
  crowd(ctx, r) {
    sky(ctx, [[0, "#07051a"], [1, "#2a1450"]]);
    for (let i = 0; i < 6; i++) {
      const tx = (i / 5) * W * 1.4 - W * 0.2;
      const g = ctx.createLinearGradient(W / 2, H * 0.35, tx, 0);
      g.addColorStop(0, ["rgba(255,58,135,.75)", "rgba(125,249,255,.6)", "rgba(255,225,74,.6)"][i % 3]);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(W / 2 - 5, H * 0.38); ctx.lineTo(tx - 34, 0); ctx.lineTo(tx + 34, 0); ctx.lineTo(W / 2 + 5, H * 0.38); ctx.fill();
    }
    ctx.fillStyle = "#ff3a87"; ctx.fillRect(W * 0.2, H * 0.4, W * 0.6, 8);
    crowd(ctx, r, H * 0.66, 46);
  },
  wristband(ctx) {
    sky(ctx, [[0, "#ffb7c9"], [1, "#ff6a9a"]]);
    ctx.fillStyle = "#e7a27f";
    ctx.beginPath(); ctx.ellipse(W * 0.52, H * 0.62, 70, 190, -0.25, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(W * 0.5, H * 0.55); ctx.rotate(-0.25);
    ctx.fillStyle = "#2a3cff"; ctx.fillRect(-80, -22, 160, 44);
    ctx.fillStyle = "#ffe14a"; for (let i = -70; i < 80; i += 18) ctx.fillRect(i, -22, 6, 44);
    ctx.fillStyle = "#fbf1df"; ctx.font = "bold 18px Arial Black, Impact, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("GC · 2027", 0, 7);
    ctx.fillStyle = "#c9c3cf"; ctx.fillRect(70, -14, 18, 28);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.18, 60, 0, 7); ctx.fill();
  },
  party(ctx, r) {
    sky(ctx, [[0, "#140726"], [1, "#3a1048"]]);
    ctx.strokeStyle = "rgba(255,225,74,.9)"; ctx.lineWidth = 1.5;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath(); ctx.moveTo(0, 40 + row * 30); ctx.quadraticCurveTo(W / 2, 90 + row * 30, W, 40 + row * 30); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const t = i / 8, x = t * W, y = (1 - t) * (1 - t) * (40 + row * 30) + 2 * (1 - t) * t * (90 + row * 30) + t * t * (40 + row * 30);
        ctx.fillStyle = ["#ffe14a", "#ff3a87", "#7df9ff"][(i + row) % 3];
        ctx.beginPath(); ctx.arc(x, y + 6, 5, 0, 7); ctx.fill();
      }
    }
    ctx.fillStyle = "#2ec4d6"; ctx.fillRect(0, H * 0.72, W, H);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let i = 0; i < 14; i++) ctx.fillRect(r() * W, H * 0.74 + r() * 90, 30 + r() * 30, 3);
    crowd(ctx, r, H * 0.58, 12, "#0b0414");
  },
  sunset(ctx, r) {
    sky(ctx, [[0, "#2a1a5e"], [0.35, "#c53a7a"], [0.62, "#ff7a3d"], [0.75, "#ffcf6b"]]);
    ctx.fillStyle = "#ffe5a0";
    ctx.beginPath(); ctx.arc(W / 2, H * 0.72, 80, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#2a1530";
    for (let i = 0; i < 6; i++) ctx.fillRect(W / 2 - 90, H * 0.6 + i * 12, 180, 4 + i);
    mountains(ctx, r, H * 0.73, "#2a1530", 8);
    palm(ctx, W * 0.12, H * 0.92, 210);
  },
  tent(ctx, r) {
    sky(ctx, [[0, "#7fc4ff"], [0.7, "#ffe9c4"]]);
    ctx.fillStyle = "#c78b5a"; ctx.fillRect(0, H * 0.7, W, H);
    const stripes = ["#ff3a87", "#fbf1df"];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = stripes[i % 2];
      ctx.beginPath(); ctx.moveTo(W / 2, H * 0.18);
      ctx.lineTo(20 + (i / 8) * (W - 40), H * 0.72); ctx.lineTo(20 + ((i + 1) / 8) * (W - 40), H * 0.72); ctx.fill();
    }
    ctx.fillStyle = "#22122e"; ctx.fillRect(W / 2 - 1, H * 0.1, 3, H * 0.1);
    ctx.fillStyle = "#ffe14a"; ctx.beginPath(); ctx.moveTo(W / 2 + 2, H * 0.1); ctx.lineTo(W / 2 + 34, H * 0.12); ctx.lineTo(W / 2 + 2, H * 0.14); ctx.fill();
    crowd(ctx, r, H * 0.8, 16, "#22122e");
  },
  house(ctx, r) {
    const skies = [
      [[0, "#ff9a5c"], [0.6, "#ffd59a"]],
      [[0, "#4f6bff"], [0.7, "#ffc2d4"]],
      [[0, "#2a1a5e"], [0.6, "#ff7a3d"]],
    ];
    sky(ctx, skies[Math.floor(r() * skies.length)]);
    mountains(ctx, r, H * 0.48, "#a85a78", 18);
    ctx.fillStyle = "#e9c79a"; ctx.fillRect(0, H * 0.55, W, H);
    const wall = ["#fbf1df", "#ffd1dc", "#cfe0ff"][Math.floor(r() * 3)];
    ctx.fillStyle = wall; ctx.fillRect(30, H * 0.36, W - 60, H * 0.26);
    ctx.fillStyle = "#22122e"; ctx.fillRect(20, H * 0.33, W - 40, 12);
    ctx.fillStyle = "#2a3cff"; ctx.fillRect(56, H * 0.42, 70, 50);
    ctx.fillStyle = "#ff6a1a"; ctx.fillRect(150, H * 0.42, 30, 64);
    ctx.fillStyle = "#2a3cff"; ctx.fillRect(196, H * 0.42, 70, 50);
    ctx.fillStyle = "#2ec4d6"; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.8, 110, 30, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(W / 2 - 70 + i * 40, H * 0.79); ctx.lineTo(W / 2 - 50 + i * 40, H * 0.79); ctx.stroke(); }
    palm(ctx, W * 0.9, H * 0.7, 160, -10);
    ctx.fillStyle = "#3a6b3f";
    for (let i = 0; i < 3; i++) { const x = 20 + r() * 60; ctx.fillRect(x, H * 0.6 - 30, 8, 40); ctx.fillRect(x - 8, H * 0.6 - 16, 8, 4); ctx.fillRect(x - 8, H * 0.6 - 26, 3, 14); }
  },
};

function finish(ctx, stamp) {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.78);
  v.addColorStop(0, "rgba(255,255,255,.06)");
  v.addColorStop(1, "rgba(0,0,0,.55)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 38; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
  if (stamp) {
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.fillStyle = "#ff8a2a"; ctx.shadowColor = "#ff4a00"; ctx.shadowBlur = 6;
    ctx.textAlign = "right"; ctx.fillText(stamp, W - 16, H - 18); ctx.shadowBlur = 0;
  }
}

export function paintScene(canvas, scene, { seed = 7, stamp } = {}) {
  const ctx = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  const r = rng(seed * 7919 + scene.length * 131);
  (SCENES[scene] || SCENES.palms)(ctx, r);
  finish(ctx, stamp);
}

/* Lazily painted when it scrolls near the screen */
export default function Scene({ scene, seed, stamp, className = "", label }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const paint = () => { if (!done) { done = true; paintScene(el, scene, { seed, stamp }); } };
    if (!("IntersectionObserver" in window)) { paint(); return; }
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (paint(), io.disconnect()), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [scene, seed, stamp]);
  return <canvas ref={ref} width={W} height={H} className={`block w-full h-auto aspect-[4/5] bg-ink ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}
