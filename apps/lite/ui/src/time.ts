import type { Locale } from "@gitbutler/i18n";

const localeFormats = new Map<
	Locale,
	{
		relative: Intl.RelativeTimeFormat;
		duration: Intl.DurationFormat;
		compact: Intl.DurationFormat;
		absolute: Intl.DateTimeFormat;
		age: Intl.DurationFormat;
	}
>();

function formats(locale: Locale) {
	let result = localeFormats.get(locale);
	if (!result) {
		result = {
			relative: new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "long" }),
			duration: new Intl.DurationFormat(locale, { style: "long" }),
			compact: new Intl.DurationFormat(locale, { style: "short" }),
			absolute: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
			age: new Intl.DurationFormat(locale, { style: "narrow" }),
		};
		localeFormats.set(locale, result);
	}
	return result;
}

/** @public */
export const formatRelativeTimeWith =
	(rtf: Intl.RelativeTimeFormat) =>
	(timestamp: number, now = Date.now()): string => {
		const seconds = Math.round((timestamp - now) / 1000);
		const absSeconds = Math.abs(seconds);

		if (absSeconds < 60) return rtf.format(seconds, "seconds");
		if (absSeconds < 60 * 60) return rtf.format(Math.round(seconds / 60), "minutes");
		if (absSeconds < 60 * 60 * 24) return rtf.format(Math.round(seconds / 60 / 60), "hours");
		if (absSeconds < 60 * 60 * 24 * 30)
			return rtf.format(Math.round(seconds / 60 / 60 / 24), "days");
		if (absSeconds < 60 * 60 * 24 * 365)
			return rtf.format(Math.round(seconds / 60 / 60 / 24 / 30), "months");
		return rtf.format(Math.round(seconds / 60 / 60 / 24 / 365), "years");
	};

export const formatRelativeTime = (
	timestamp: number,
	now = Date.now(),
	locale: Locale = "en",
): string => formatRelativeTimeWith(formats(locale).relative)(timestamp, now);

/** The tightest reading — "26m", "1h", "3d" — for dense rows. */
export const formatCompactRelativeTime = (
	timestamp: number,
	now = Date.now(),
	locale: Locale = "en",
): string => {
	const compact = (
		value: number,
		unit: "seconds" | "minutes" | "hours" | "days" | "months" | "years",
		suffix: string,
	) => (locale === "en" ? `${value}${suffix}` : formats(locale).age.format({ [unit]: value }));
	const seconds = Math.max(1, Math.round(Math.abs(now - timestamp) / 1000));
	if (seconds < 60) return compact(seconds, "seconds", "s");
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return compact(minutes, "minutes", "m");
	const hours = Math.round(minutes / 60);
	if (hours < 24) return compact(hours, "hours", "h");
	const days = Math.round(hours / 24);
	if (days < 30) return compact(days, "days", "d");
	const months = Math.round(days / 30);
	if (months < 12) return compact(months, "months", "mo");
	return compact(Math.round(days / 365), "years", "y");
};

/** @public */
export const formatDurationWith =
	(df: Intl.DurationFormat) =>
	(ms: number): string => {
		const sign = Math.sign(ms);
		let msRemaining = Math.round(Math.abs(ms));

		const weeks = Math.trunc(msRemaining / 604_800_000);
		msRemaining %= 604_800_000;
		const days = Math.trunc(msRemaining / 86_400_000);
		msRemaining %= 86_400_000;
		const hours = Math.trunc(msRemaining / 3_600_000);
		msRemaining %= 3_600_000;
		const minutes = Math.trunc(msRemaining / 60_000);
		msRemaining %= 60_000;
		const seconds = Math.trunc(msRemaining / 1_000);
		msRemaining %= 1_000;

		return df.format({
			weeks: weeks * sign,
			days: days * sign,
			hours: hours * sign,
			minutes: minutes * sign,
			seconds: seconds * sign,
			milliseconds: msRemaining * sign,
		});
	};

export const formatDuration = (ms: number, locale: Locale = "en"): string =>
	formatDurationWith(formats(locale).duration)(ms);

/**
 * A duration rounded to its largest whole unit, for places with room for one
 * number and nothing more ("12 min", "1 hr"). Sub-minute durations round up to
 * a second so a fast job doesn't read as having taken no time at all.
 *
 * @public
 */
export const formatCompactDurationWith =
	(df: Intl.DurationFormat) =>
	(ms: number): string => {
		// Round before choosing the unit: picking first lets a value that rounds
		// up to a full unit render as "60 sec" or "60 min".
		const seconds = Math.max(1, Math.round(ms / 1_000));
		if (seconds < 60) return df.format({ seconds });

		const minutes = Math.round(ms / 60_000);
		if (minutes < 60) return df.format({ minutes });

		return df.format({ hours: Math.round(ms / 3_600_000) });
	};

export const formatCompactDuration = (ms: number, locale: Locale = "en"): string =>
	formatCompactDurationWith(formats(locale).compact)(ms);

export const formatAbsoluteTime = (timestamp: number, locale: Locale = "en"): string =>
	formats(locale).absolute.format(timestamp);

/** @internal */
export const formatAgeBadgeWith =
	(df: Intl.DurationFormat, nowLabel = "now") =>
	(ageMs: number): string => {
		const minutes = Math.floor(Math.max(0, ageMs) / 60_000);
		if (minutes < 1) return nowLabel;
		if (minutes < 60) return df.format({ minutes });

		const hours = Math.floor(minutes / 60);
		if (hours < 24) return df.format({ hours });

		const days = Math.floor(hours / 24);
		return days < 7 ? df.format({ days }) : df.format({ weeks: Math.floor(days / 7) });
	};

/**
 * Abbreviated age for tight row badges: "now", "3m", "2h", "5d", "3w". Every age
 * gets a label; how far back it is reads from {@link ageBadgeOpacity} instead.
 */
export const formatAgeBadge = (ageMs: number, locale: Locale = "en"): string =>
	formatAgeBadgeWith(formats(locale).age, locale === "zh-CN" ? "刚刚" : "now")(ageMs);

/** How faint an old badge is allowed to get before it stops being readable. */
const AGE_BADGE_MIN_OPACITY = 0.35;

/** The age at which a badge reaches {@link AGE_BADGE_MIN_OPACITY}. */
const AGE_BADGE_FADE_SPAN_MINUTES = 24 * 60;

/**
 * Contrast for an age badge, easing from full strength down to a legible floor.
 * Logarithmic: five minutes versus an hour matters far more to someone scanning
 * than five days versus a week.
 */
export const ageBadgeOpacity = (ageMs: number): number => {
	const minutes = Math.max(0, ageMs) / 60_000;
	const fade = Math.min(1, Math.log1p(minutes) / Math.log1p(AGE_BADGE_FADE_SPAN_MINUTES));
	return 1 - (1 - AGE_BADGE_MIN_OPACITY) * fade;
};
