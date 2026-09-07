import {
	bindDocumentLanguage,
	createI18n,
	normalizePreference,
	resolveLocale,
} from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/lite";
import type { GUISettings } from "#electron/settings.ts";

export const i18n = createI18n(resources);

export async function initializeLanguage(settings: GUISettings) {
	i18n.setLocale(
		resolveLocale(normalizePreference(settings.language), await window.lite.getSystemLocale()),
	);
	bindDocumentLanguage(i18n, document);
}
