import { formatRelativeTime } from "@gitbutler/i18n/format";
import type { Locale } from "@gitbutler/i18n";
export function formatDate(dateStr: string, locale: Locale = "en"): string {
	const date = new Date(dateStr);
	const now = new Date();

	const diff = now.getTime() - date.getTime();
	const diffInDays = diff / (1000 * 3600 * 24);

	if (diffInDays < 1) {
		const diffInHours = diff / (1000 * 3600);

		if (diffInHours < 1) {
			const diffInMinutes = diff / (1000 * 60);

			if (diffInMinutes < 1) {
				const diffInSeconds = diff / 1000;

				return formatRelativeTime(locale, -Math.floor(diffInSeconds), "seconds");
			}

			return formatRelativeTime(locale, -Math.floor(diffInMinutes), "minutes");
		}

		return formatRelativeTime(locale, -Math.floor(diffInHours), "hours");
	}

	if (diffInDays < 30) {
		return formatRelativeTime(locale, -Math.floor(diffInDays), "days");
	}

	const diffInMonths = diffInDays / 30;

	if (diffInMonths < 12) {
		return formatRelativeTime(locale, -Math.floor(diffInMonths), "months");
	}

	const diffInYears = diffInMonths / 12;

	return formatRelativeTime(locale, -Math.floor(diffInYears), "years");
}
