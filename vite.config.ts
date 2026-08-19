import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Strip ALL banner/legal comments from every chunk during minify.
    // lucide-react ships a per-icon `/** @license ... */` block that
    // esbuild leaves alone by default — costing ~5KB on vendor-icons
    // per Lighthouse "Minify JavaScript" audit. We retain license
    // attribution at the package.json + LICENSE level; bundles can shed.
    legalComments: "none",
  },
  build: {
    // TaskManager.tsx is a 10k-line monolith that lazy-loads for /task/app
    // users only — it never ships to marketing visitors. Bumping the warning
    // ceiling so the build log stops yelling about a known, isolated chunk.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
          ],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-xlsx": ["xlsx"],
          // Lucide icons are imported á la carte across the site — split
          // them into their own chunk so the React vendor stays small.
          "vendor-icons": ["lucide-react", "react-icons"],
        },
      },
    },
  },
}));
