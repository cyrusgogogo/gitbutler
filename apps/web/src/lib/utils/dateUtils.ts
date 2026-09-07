import { formatRelativeTime } from "@gitbutler/i18n/format";
import type { Locale } from "@gitbutler/i18n";
/**
 * Formats a date string into a relative time string (e.g., "5 minutes ago", "2 days ago").
 *
 * @param dateString - ISO date string to format
 * @returns Formatted relative time string
 */
export function getRelativeTime(dateString: string, locale: Locale = "en"): string {
	const date = new Date(dateString);
	const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - utcDate.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return formatRelativeTime(locale, -diffInSeconds, "seconds");
	}
	if (diffInSeconds < 3600) {
		return formatRelativeTime(locale, -Math.floor(diffInSeconds / 60), "minutes");
	}
	if (diffInSeconds < 86400) {
		return formatRelativeTime(locale, -Math.floor(diffInSeconds / 3600), "hours");
	}
	if (diffInSeconds < 2592000) {
		return formatRelativeTime(locale, -Math.floor(diffInSeconds / 86400), "days");
	}
	if (diffInSeconds < 31536000) {
		return formatRelativeTime(locale, -Math.floor(diffInSeconds / 2592000), "months");
	}
	return formatRelativeTime(locale, -Math.floor(diffInSeconds / 31536000), "years");
}

export function getTimeSince(timestamp: string | undefined, locale: Locale = "en") {
	if (!timestamp) return locale === "zh-CN" ? "未知" : "Unknown";

	const date = new Date(timestamp);
	const now = new Date();
	const diffTime = Math.abs(now.getTime() - date.getTime());
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return formatRelativeTime(locale, 0, "day", "auto");
	} else if (diffDays === 1) {
		return formatRelativeTime(locale, -1, "day", "auto");
	} else if (diffDays < 7) {
		return formatRelativeTime(locale, -diffDays, "days");
	} else if (diffDays < 30) {
		return formatRelativeTime(locale, -Math.floor(diffDays / 7), "weeks");
	} else if (diffDays < 365) {
		return formatRelativeTime(locale, -Math.floor(diffDays / 30), "months");
	} else {
		return formatRelativeTime(locale, -Math.floor(diffDays / 365), "years");
	}
}
