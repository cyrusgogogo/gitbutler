import type { Locale } from "./index.js";

const dateFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();
const relativeFormats = new Map<string, Intl.RelativeTimeFormat>();
const listFormats = new Map<Locale, Intl.ListFormat>();

export function formatList(locale: Locale, values: string[]) {
	let formatter = listFormats.get(locale);
	if (!formatter) {
		formatter = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
		listFormats.set(locale, formatter);
	}
	return formatter.format(values);
}

export function formatRelativeTime(
	locale: Locale,
	value: number,
	unit: Intl.RelativeTimeFormatUnit,
	numeric: "always" | "auto" = "always",
) {
	const key = `${locale}:${numeric}`;
	let formatter = relativeFormats.get(key);
	if (!formatter) {
		formatter = new Intl.RelativeTimeFormat(locale, { numeric });
		relativeFormats.set(key, formatter);
	}
	return formatter.format(value, unit);
}

/** Reuse Intl formatters across rows; locale is an explicit rendering dependency. */
export function formatDate(
	locale: string,
	value: Date | number,
	options: Intl.DateTimeFormatOptions,
) {
	const key = `${locale}:${JSON.stringify(options)}`;
	let formatter = dateFormats.get(key);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(locale, options);
		dateFormats.set(key, formatter);
	}
	return formatter.format(value);
}

export function formatNumber(
	locale: Locale,
	value: number,
	options: Intl.NumberFormatOptions = {},
) {
	const key = `${locale}:${JSON.stringify(options)}`;
	let formatter = numberFormats.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, options);
		numberFormats.set(key, formatter);
	}
	return formatter.format(value);
}
