import { getContext, setContext } from "svelte";
import type { browserLanguage } from "@gitbutler/i18n/browser";

type BrowserLanguage = ReturnType<typeof browserLanguage>;
const key = Symbol("Web language preference");
export function provideLanguage(language: BrowserLanguage) {
	return setContext(key, language);
}
export function getLanguage() {
	return getContext<BrowserLanguage>(key);
}
