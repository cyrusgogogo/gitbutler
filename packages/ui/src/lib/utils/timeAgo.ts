import { formatDate } from "@gitbutler/i18n/format";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { writable, type Readable } from "svelte/store";
import type { I18n, Locale } from "@gitbutler/i18n";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

function customFormatDistance(date: Date, addSuffix: boolean, locale: Locale): string {
	const distance = dayjs(date).locale(locale.toLowerCase()).fromNow(!addSuffix);
	return distance.replace(
		/\b(seconds?|minutes?|hours?|days?|months?|years?)\b/g,
		(match) => unitShorthandMap[match] ?? "",
	);
}

function getSecondsUntilUpdate(seconds: number) {
	const min = 60;
	const hr = min * 60;
	const day = hr * 24;
	if (seconds < min) {
		return 1;
	} else if (seconds < hr) {
		return 15;
	} else if (seconds < day) {
		return 300;
	} else {
		return 3600;
	}
}

export function getTimeAgo(
	input: Date | number,
	addSuffix: boolean = true,
	locale: Locale = "en",
): string {
	const date = typeof input === "number" ? new Date(input) : input;

	const seconds = Math.round(Math.abs((new Date().getTime() - date.getTime()) / 1000.0));
	if (seconds < 10) {
		return locale === "zh-CN" ? "刚刚" : "just now";
	} else {
		return customFormatDistance(date, addSuffix, locale);
	}
}

/**
 * Generic helper to create a time-based store that updates at smart intervals
 */
function createTimeBasedStore(
	date: Date | undefined,
	formatFn: (date: Date) => string,
	getUpdateInterval: (seconds: number) => number,
	i18n?: I18n,
): Readable<string> | undefined {
	if (!date) return;
	let timeoutId: number;
	return writable<string>(formatFn(date), (set) => {
		function updateStore() {
			if (!date) return;
			clearTimeout(timeoutId);
			const seconds = Math.round(Math.abs((new Date().getTime() - date.getTime()) / 1000.0));
			const msUntilNextUpdate = Number.isNaN(seconds) ? 1000 : getUpdateInterval(seconds) * 1000;

			set(formatFn(date));

			timeoutId = window.setTimeout(() => {
				updateStore();
			}, msUntilNextUpdate);
		}
		updateStore();
		const unsubscribe = i18n?.subscribe(updateStore);
		return () => {
			unsubscribe?.();
			clearTimeout(timeoutId);
		};
	});
}

export function createTimeAgoStore(
	date: Date | undefined,
	addSuffix: boolean = false,
	i18n?: I18n,
): Readable<string> | undefined {
	return createTimeBasedStore(
		date,
		(d) => getTimeAgo(d, addSuffix, i18n?.locale),
		getSecondsUntilUpdate,
		i18n,
	);
}

/**
 * Formats a date into an absolute timestamp using browser locale
 * Example: "January 15, 2024 at 3:45 PM" (US) or "15 January 2024 at 15:45" (UK)
 */
export function getAbsoluteTimestamp(
	input: Date | number | undefined,
	locale: string = "en",
): string {
	if (!input) return "";
	const date = typeof input === "number" ? new Date(input) : input;

	// Format the date and time using specified locale or browser locale
	const dateStr = formatDate(locale, date, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const timeStr = formatDate(locale, date, {
		hour: "2-digit",
		minute: "2-digit",
	});

	return locale === "zh-CN" ? `${dateStr} ${timeStr}` : `${dateStr} at ${timeStr}`;
}

/**
 * Formats a timestamp with dynamic formatting based on age:
 * - < 2 minutes: shows time with seconds using browser locale
 * - < 24 hours: shows time without seconds using browser locale
 * - > 24 hours: shows date and time without seconds using browser locale
 */
export function getTimestamp(input: Date | number, locale: Locale = "en"): string {
	const date = typeof input === "number" ? new Date(input) : input;
	const seconds = Math.round(Math.abs((new Date().getTime() - date.getTime()) / 1000.0));

	const twoMinutes = 2 * 60;
	const day = 24 * 60 * 60;

	if (seconds < twoMinutes) {
		// Show time with seconds using browser locale
		return formatDate(locale, date, {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	} else if (seconds < day) {
		// Show time without seconds using browser locale
		return formatDate(locale, date, {
			hour: "2-digit",
			minute: "2-digit",
		});
	} else {
		// Show date and time without seconds using browser locale
		const dateStr = formatDate(locale, date, {
			month: "2-digit",
			day: "2-digit",
		});
		const timeStr = formatDate(locale, date, {
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${dateStr} ${timeStr}`;
	}
}

function getSecondsUntilTimestampUpdate(seconds: number): number {
	const twoMinutes = 2 * 60;
	const day = 24 * 60 * 60;

	if (seconds < twoMinutes) {
		// Update every minute to refresh the seconds display
		return 60;
	} else if (seconds < day) {
		// Update every hour to check if we've crossed the 24h boundary
		return 3600;
	} else {
		// Update every hour in case format needs to change
		return 3600;
	}
}

/**
 * Creates a store that displays a timestamp with dynamic formatting that updates intelligently
 */
export function createTimestampStore(
	date: Date | undefined,
	i18n?: I18n,
): Readable<string> | undefined {
	return createTimeBasedStore(
		date,
		(date) => getTimestamp(date, i18n?.locale),
		getSecondsUntilTimestampUpdate,
		i18n,
	);
}

// SHORTHAND WORDS
const unitShorthandMap: Record<string, string> = {
	second: "sec",
	seconds: "sec",
	minute: "min",
	minutes: "min",
	hour: "hour",
	hours: "hours",
	day: "day",
	days: "days",
	month: "mo",
	months: "mo",
	year: "yr",
	years: "yr",
};
