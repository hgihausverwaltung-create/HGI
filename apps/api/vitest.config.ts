import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: "test-secret-do-not-use-in-production",
    },
  },
});
