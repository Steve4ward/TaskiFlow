import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: { reporter: ["text", "lcov"], reportsDirectory: "coverage" },
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { 
    alias: { 
      "@": fileURLToPath(new URL("./src", import.meta.url)) 
    } 
  },
});
