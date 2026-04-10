import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        web: resolve(__dirname, "index.html"),
        desktop: resolve(__dirname, "desktop.html")
      }
    }
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8787"
    }
  }
});
