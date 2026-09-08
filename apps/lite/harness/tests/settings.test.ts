// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { readSettings, writeSettings } from "../../electron/src/settings.ts";

const state = vi.hoisted(() => ({ userData: "" }));
vi.mock("electron", () => ({ app: { getPath: () => state.userData } }));
let warning: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
	state.userData = await mkdtemp(path.join(os.tmpdir(), "gitbutler-settings-"));
	warning = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
	await rm(state.userData, { recursive: true, force: true });
	vi.restoreAllMocks();
});

test("first launch uses defaults without reporting a missing settings file as an error", async () => {
	await expect(readSettings()).resolves.toEqual({ version: 1 });
	expect(warning).not.toHaveBeenCalled();
});

test("a saved language and unrelated settings survive reading", async () => {
	const settings = { version: 1, language: "zh-CN", theme: "dark" } as const;
	await writeSettings(settings);
	await expect(readSettings()).resolves.toEqual(settings);
	expect(warning).not.toHaveBeenCalled();
});

test("a corrupt settings file still reports the failure", async () => {
	await writeFile(path.join(state.userData, "settings.json"), "{invalid", "utf8");
	await expect(readSettings()).resolves.toEqual({ version: 1 });
	expect(warning).toHaveBeenCalledOnce();
});
