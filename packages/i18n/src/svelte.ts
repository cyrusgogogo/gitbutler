import { createI18n, type I18n } from "./index.js";
import { getContext, setContext } from "svelte";
import { readable, type Readable } from "svelte/store";

const contextKey = Symbol("GitButler i18n");
let fallback = createI18n({ en: {} });

/** Configure isolated component tests and Storybook; applications provide their own instance. */
export function setFallbackI18n(i18n: I18n): void {
	fallback = i18n;
}

export function provideI18n(i18n: I18n): void {
	setContext(contextKey, i18n);
}
export function getI18n(): I18n {
	return getContext<I18n | undefined>(contextKey) ?? fallback;
}

export type Translations = { t: I18n["t"]; text: I18n["text"]; locale: I18n["locale"] };

export function useTranslations(): Readable<Translations> {
	const i18n = getI18n();
	function snapshot() {
		return { t: i18n.t, text: i18n.text, locale: i18n.locale };
	}
	return readable(snapshot(), (set) => i18n.subscribe(() => set(snapshot())));
}
