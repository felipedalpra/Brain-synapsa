import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Um único HTML: abre em qualquer lugar (inclusive como prévia publicada).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // No desenvolvimento, /api vai para o Brain local.
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
  build: { target: "es2022", chunkSizeWarningLimit: 2000 },
});
