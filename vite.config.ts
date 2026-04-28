import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/ai-tooling-presentation/" : "./",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    open: false
  }
});
