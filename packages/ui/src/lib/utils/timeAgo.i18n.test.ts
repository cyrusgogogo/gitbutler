// @vitest-environment jsdom
import { createTimeAgoStore, getAbsoluteTimestamp, getTimeAgo } from "$lib/utils/timeAgo";
import { createI18n } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/ui";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => vi.useRealTimers());

it("changes an existing relative-time subscription immediately and keeps English independent", () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date(2026, 8, 7, 12));
	const date = new Date(2026, 8, 7, 9);
	const i18n = createI18n(resources, "en");
	const store = createTimeAgoStore(date, true, i18n)!;
	let displayed = "";
	const unsubscribe = store.subscribe((text) => {
		displayed = text;
	});
	expect(displayed).toBe("3 hours ago");
	i18n.setLocale("zh-CN");
	expect(displayed).toBe("3 小时前");
	expect(getTimeAgo(date, true, "en")).toBe("3 hours ago");
	unsubscribe();
	expect(vi.getTimerCount()).toBe(0);
});

it("localizes a timestamp without changing the represented local date", () => {
	const date = new Date(2026, 8, 7, 20, 30);
	expect(getAbsoluteTimestamp(date, "en-US")).toBe("September 7, 2026 at 08:30 PM");
	expect(getAbsoluteTimestamp(date, "zh-CN")).toBe("2026年9月7日 20:30");
});
