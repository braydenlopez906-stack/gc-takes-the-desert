import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In `npm run dev`, serve /api/* with the same code Vercel runs in production.
function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/api\/(preview|song)(\?|$)/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
          const r = await mod.GET(new Request(new URL(req.originalUrl, "http://localhost")));
          res.statusCode = r.status;
          r.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await r.arrayBuffer()));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

// Group-chat link previews need an absolute image URL. Vercel sets this variable during builds.
function ogImage() {
  return {
    name: "og-image",
    transformIndexHtml(html) {
      const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
      return html.replace("%OG_IMAGE%", `${site}/og.png`);
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi(), ogImage()],
  build: {
    rollupOptions: {
      output: { manualChunks: { react: ["react", "react-dom"], motion: ["framer-motion"], supabase: ["@supabase/supabase-js"] } },
    },
  },
});
