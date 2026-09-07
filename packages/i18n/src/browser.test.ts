import { createI18n } from "./index";
import { browserLanguage } from "./browser";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

function environment(saved: string | null = null) {
	const events = new EventTarget();
	const storage = new Map(saved === null ? [] : [["app.language", saved]]);
	vi.stubGlobal("window", events);
	vi.stubGlobal("localStorage", {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
	});
	return events;
}

describe("browser preference lifecycle", () => {
	it("follows system changes until the user makes an explicit choice", () => {
		const events = environment();
		let system = "zh-SG";
		const i18n = createI18n({});
		const preference = browserLanguage(i18n, "app.language", () => system);
		expect(i18n.locale).toBe("zh-CN");
		preference.set("en");
		system = "zh-CN";
		events.dispatchEvent(new Event("languagechange"));
		expect(i18n.locale).toBe("en");
		preference.set("system");
		expect(i18n.locale).toBe("zh-CN");
		preference.destroy();
		system = "en-US";
		events.dispatchEvent(new Event("languagechange"));
		expect(i18n.locale).toBe("zh-CN");
	});

	it("synchronizes the preference even when both choices resolve to English", () => {
		const events = environment("en");
		const i18n = createI18n({});
		const preference = browserLanguage(i18n, "app.language", () => "en-US");
		const changed = vi.fn();
		preference.subscribe(changed);
		const event = Object.assign(new Event("storage"), { key: "app.language", newValue: "system" });
		events.dispatchEvent(event);
		expect(preference.getSnapshot()).toBe("system");
		expect(changed).toHaveBeenCalledOnce();
		expect(i18n.locale).toBe("en");
		events.dispatchEvent(
			Object.assign(new Event("storage"), { key: "other.language", newValue: "zh-CN" }),
		);
		expect(changed).toHaveBeenCalledOnce();
		preference.destroy();
	});

	it("reports denied storage while retaining the current session's choice", () => {
		environment();
		vi.stubGlobal("localStorage", {
			getItem() {
				throw new Error("Storage is unavailable in this host");
			},
			setItem() {
				throw new Error("Storage is unavailable in this host");
			},
		});
		const i18n = createI18n({});
		const preference = browserLanguage(i18n, "app.language", () => "en-US");
		expect(preference.set("zh-CN")).toBe(false);
		expect(preference.preference).toBe("zh-CN");
		expect(i18n.locale).toBe("zh-CN");
		preference.refresh();
		expect(i18n.locale).toBe("zh-CN");
		preference.destroy();
	});
});
