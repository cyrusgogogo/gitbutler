import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	use: { viewport: { width: 720, height: 720 } },
});
