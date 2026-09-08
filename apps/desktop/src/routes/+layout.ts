import createBackend from "$lib/backend";
import { DesktopLanguage } from "$lib/i18n";
import { SettingsService } from "$lib/settings/appSettings";
import { normalizePreference } from "@gitbutler/i18n";
import lscache from "lscache";
import type { LayoutLoad } from "./$types";

// call on startup so we don't accumulate old items
lscache.flushExpired();

export const ssr = false;
export const prerender = false;
export const csr = true;

// eslint-disable-next-line
export const load: LayoutLoad = async () => {
	// Load local preferences before the first render.
	const backend = createBackend();

	const homeDir = await backend.homeDirectory();

	const settingsService = new SettingsService(backend);
	const appSettings = await settingsService.fetchAppSettings();
	const language = new DesktopLanguage(settingsService, backend);
	await language.initialize(normalizePreference(appSettings.ui.language));

	return {
		homeDir,
		backend,
		settingsService,
		appSettings,
		language,
	};
};
