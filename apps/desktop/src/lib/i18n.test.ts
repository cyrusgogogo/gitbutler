import { DesktopLanguage } from "$lib/i18n";
import { writable } from "svelte/store";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IBackend } from "$lib/backend";
import type { SettingsService } from "$lib/settings/appSettings";

let stop: (() => void) | undefined;
afterEach(() => {
	stop?.();
	stop = undefined;
});

function setup() {
	const state = writable({ ui: { language: "en" } });
	const updateUi = vi.fn(async ({ language }: { language: string }) => {
		state.set({ ui: { language } });
	});
	const settings = { subscribe: state.subscribe, updateUi } as unknown as SettingsService;
	const getSystemLocale = vi.fn(async () => "zh-SG");
	const setMenuLocale = vi.fn(async () => {});
	const backend = { getSystemLocale, setMenuLocale } as unknown as IBackend;
	return {
		language: new DesktopLanguage(settings, backend),
		state,
		updateUi,
		getSystemLocale,
		setMenuLocale,
	};
}

describe("desktop language preference", () => {
	it("resolves system language before rendering", async () => {
		const { language } = setup();
		await language.initialize("system");
		expect(language.i18n.locale).toBe("zh-CN");
		await language.initialize("en");
		expect(language.i18n.locale).toBe("en");
	});

	it("restores the displayed language and menu when persistence fails", async () => {
		const { language, updateUi, setMenuLocale } = setup();
		await language.initialize("en");
		const failure = new Error("Settings file is not writable");
		updateUi.mockRejectedValueOnce(failure);
		const saving = language.set("zh-CN");
		expect(language.i18n.locale).toBe("zh-CN");
		await expect(saving).rejects.toBe(failure);
		expect(language.i18n.locale).toBe("en");
		expect(setMenuLocale.mock.calls).toEqual([["zh-CN"], ["en"]]);
	});

	it("persists only the language field and follows changes from another window", async () => {
		const { language, state, updateUi } = setup();
		await language.initialize("en");
		stop = language.start();
		await language.set("zh-CN");
		expect(updateUi).toHaveBeenCalledWith({ language: "zh-CN" });
		expect(document.documentElement.lang).toBe("zh-CN");
		state.set({ ui: { language: "en" } });
		expect(language.i18n.locale).toBe("en");
		expect(document.documentElement.lang).toBe("en");
	});

	it("keeps an explicit preference across an OS language notification", async () => {
		const { language, getSystemLocale } = setup();
		await language.initialize("en");
		stop = language.start();
		await language.set("zh-CN");
		getSystemLocale.mockResolvedValue("en-US");
		window.dispatchEvent(new Event("languagechange"));
		await vi.waitFor(() => expect(getSystemLocale).toHaveBeenCalledTimes(2));
		expect(language.i18n.locale).toBe("zh-CN");
	});
});
