import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = {
  "@": path.resolve(__dirname, "src"),
  // `server-only` throws outside the React Server Components bundler; tests run in plain Node.
  "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup-env.ts"],
          // Tests share one database — run files sequentially in a single worker
          // (`fileParallelism` is root-only in Vitest 3, so it is not allowed per project)
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
