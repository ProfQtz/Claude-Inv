import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset URLs, so the build works from any path (GitHub Pages, a subfolder, a file share).
  base: "./",
  plugins: [react()],
  build: {
    // The course content and preflop equity table ship in the main chunk on purpose,
    // so no screen waits on a network fetch after the first load. Warn only if it grows well past that.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "node",
    // Some tests simulate thousands of hands; give slower CI machines room to finish.
    testTimeout: 30_000,
  },
});
