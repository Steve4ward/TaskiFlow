import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",   // for API/lib tests
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    watch: false,
  },
});
