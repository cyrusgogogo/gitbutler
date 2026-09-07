import { createI18n, errorText, message, normalizePreference, resolveLocale } from "./index";
import { describe, expect, it } from "vitest";
import type { MessageKey } from "./keys";

const resources = {
	en: {
		test: {
			greeting: "Hello, {{name}}",
			files_one: "{{count}} file",
			files_other: "{{count}} files",
			fallback: "Available in English",
			rich: "Open <link>{{name}}</link>",
		},
	},
	"zh-CN": {
		test: {
			greeting: "你好，{{name}}",
			files_other: "{{count}} 个文件",
			rich: "打开<link>{{name}}</link>",
		},
	},
};

describe("language selection", () => {
	it.each(["zh", "zh-CN", "zh-SG", "zh-Hans", "zh-Hans-HK", "zh_CN"])(
		"recognizes Simplified Chinese: %s",
		(language) => {
			expect(resolveLocale("system", language)).toBe("zh-CN");
		},
	);
	it.each(["en-GB", "ja-JP", "zh-TW", "zh-HK", "zh-MO", "zh-Hant-CN", "invalid!", undefined])(
		"falls back to English: %s",
		(language) => {
			expect(resolveLocale("system", language)).toBe("en");
		},
	);
	it("keeps an explicit choice independent of the system", () => {
		expect(resolveLocale("en", "zh-CN")).toBe("en");
		expect(resolveLocale("zh-CN", "en-US")).toBe("zh-CN");
		expect(normalizePreference(undefined)).toBe("system");
		expect(normalizePreference("fr")).toBe("system");
	});
});

describe("translation runtime", () => {
	it("keeps an English diagnostic while localizing an app-owned error at display time", () => {
		const i18n = createI18n(resources, "zh-CN");
		const error = i18n.error("test:greeting" as MessageKey, { name: "feature/my-branch" });
		expect(error.message).toBe("Hello, feature/my-branch");
		expect(i18n.text(errorText(error, "fallback"))).toBe("你好，feature/my-branch");
		i18n.setLocale("en");
		expect(i18n.text(errorText(error, "fallback"))).toBe("Hello, feature/my-branch");
		const remote = new Error("fatal: permission denied (publickey)");
		expect(errorText(remote, "fallback")).toBe(remote.message);
	});
	it("interpolates complete sentences and falls back to English", () => {
		const i18n = createI18n(resources, "zh-CN");
		expect(i18n.t("test:greeting" as MessageKey, { name: "Cyrus" })).toBe("你好，Cyrus");
		expect(i18n.t("test:fallback" as MessageKey)).toBe("Available in English");
	});
	it("uses each language's plural rules, including zero", () => {
		const i18n = createI18n(resources, "en");
		expect(i18n.t("test:files" as MessageKey, { count: 0 })).toBe("0 files");
		expect(i18n.t("test:files" as MessageKey, { count: 1 })).toBe("1 file");
		i18n.setLocale("zh-CN");
		expect(i18n.t("test:files" as MessageKey, { count: 1 })).toBe("1 个文件");
		expect(i18n.t("test:files" as MessageKey, { count: 2 })).toBe("2 个文件");
	});
	it("resolves queued messages in the current language, without translating raw data", () => {
		const i18n = createI18n(resources, "en");
		const queued = message("test:greeting" as MessageKey, { name: "Cyrus" });
		i18n.setLocale("zh-CN");
		expect(i18n.text(queued)).toBe("你好，Cyrus");
		expect(i18n.text("Hello, Cyrus")).toBe("Hello, Cyrus");
	});
	it("resolves nested labels when a queued message is displayed", () => {
		const i18n = createI18n(resources, "en");
		const queued = message("test:greeting" as MessageKey, {
			name: message("test:files" as MessageKey, { count: 2 }),
		});
		expect(i18n.text(queued)).toBe("Hello, 2 files");
		i18n.setLocale("zh-CN");
		expect(i18n.text(queued)).toBe("你好，2 个文件");
		expect(i18n.error(queued.key as MessageKey, queued.values).message).toBe("Hello, 2 files");
	});
	it("keeps instances isolated and only notifies on a language change", () => {
		const first = createI18n(resources, "en");
		const second = createI18n(resources, "en");
		let updates = 0;
		const unsubscribe = first.subscribe(() => {
			updates++;
		});
		first.setLocale("en");
		expect(updates).toBe(0);
		first.setLocale("zh-CN");
		expect(updates).toBe(1);
		expect(second.locale).toBe("en");
		unsubscribe();
		first.setLocale("en");
		expect(updates).toBe(1);
	});
	it("does not allow interpolated content to introduce rich-text tags", () => {
		const i18n = createI18n(resources, "zh-CN");
		const parts = i18n.parts(
			message("test:rich" as MessageKey, { name: "<script>alert(1)</script>" }),
		);
		expect(parts).toEqual([
			{ type: "text", text: "打开" },
			{
				type: "tag",
				name: "link",
				children: [{ type: "text", text: "<script>alert(1)</script>" }],
			},
		]);
	});
});
