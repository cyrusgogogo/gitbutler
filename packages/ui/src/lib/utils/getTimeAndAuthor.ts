import { getTimeAgo } from "$lib/utils/timeAgo";
import type { Locale } from "@gitbutler/i18n";

export function getTimeAndAuthor(
	createdAt: Date,
	name: string | undefined,
	locale: Locale = "en",
): string {
	const timeAgo = getTimeAgo(createdAt, true, locale);

	if (name) {
		return locale === "zh-CN" ? `${timeAgo}，作者：${name}` : `${timeAgo} by ${name}`;
	}

	return timeAgo;
}
