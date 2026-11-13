import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 5173 },
  build: {
    sourcemap: true,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": ["react", "react-dom", "react-router"],
          "data-core": ["@tanstack/react-query", "@tanstack/react-table", "@supabase/supabase-js"],
          "motion": ["framer-motion"],
          "charts": ["recharts"],
          "icons": ["lucide-react"]
        }
      }
    }
  }
});
