import { getTimeAgo } from "@gitbutler/ui/utils/timeAgo";
import type { Locale } from "@gitbutler/i18n";
import type { UserMaybe } from "@gitbutler/shared/users/types";

const UNKNOWN_AUTHOR = "Unknown author";

export type TimestampedEvent = {
	createdAt: string;
	updatedAt: string;
};

function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

export function eventTimeStamp(event: TimestampedEvent, locale: Locale = "en"): string {
	const creationDate = new Date(event.createdAt);

	const createdToday = isSameDay(creationDate, new Date());

	if (createdToday) {
		return (
			(locale === "zh-CN" ? "今天 " : "Today at ") +
			creationDate.toLocaleTimeString(locale, {
				hour: "numeric",
				minute: "numeric",
			})
		);
	}

	return getTimeAgo(creationDate, true, locale);
}

export function getMultipleContributorNames(
	contributors: UserMaybe[],
	locale: Locale = "en",
): string {
	const unknownAuthor = locale === "zh-CN" ? "未知作者" : UNKNOWN_AUTHOR;
	if (contributors.length === 0) {
		return unknownAuthor;
	}

	return contributors
		.map((contributor) => {
			if (contributor.user) {
				const user = contributor.user;
				return user.login ?? user.name ?? user.email ?? unknownAuthor;
			} else {
				return contributor.email;
			}
		})
		.join(", ");
}
