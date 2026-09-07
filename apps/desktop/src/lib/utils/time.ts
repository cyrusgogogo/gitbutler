import { formatDate } from "@gitbutler/i18n/format";
import dayjs from "dayjs";
import type { Locale } from "@gitbutler/i18n";

export function toHumanReadableTime(d: Date, locale: Locale = "en") {
	return formatDate(locale, d, {
		hour: "numeric",
		minute: "numeric",
	});
}

export function msSinceDaysAgo(days: number) {
	return Math.abs(dayjs().subtract(days, "day").endOf("day").diff(dayjs(), "millisecond"));
}
