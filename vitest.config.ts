import path from "node:path";
import { defineConfig } from "vitest/config";
import { config } from "dotenv";

// Las pruebas de servicios corren contra un Postgres real (índice parcial, ADR-0004).
config({ path: ".env.test", override: true });

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
  },
});
