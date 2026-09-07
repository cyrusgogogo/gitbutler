import { initAnalyticsIfEnabled } from "$lib/analytics/analytics";
import createBackend from "$lib/backend";
import { DesktopLanguage } from "$lib/i18n";
import { SettingsService } from "$lib/settings/appSettings";
import { EventContext } from "$lib/telemetry/eventContext";
import { PostHogWrapper } from "$lib/telemetry/posthog";
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
	// Awaited and will block initial render, but it is necessary in order to respect the user
	// settings on telemetry.
	const backend = createBackend();

	const homeDir = await backend.homeDirectory();

	const eventContext = new EventContext();

	const settingsService = new SettingsService(backend);
	const appSettings = await settingsService.fetchAppSettings();
	const language = new DesktopLanguage(settingsService, backend);
	await language.initialize(normalizePreference(appSettings.ui.language));

	const posthog = new PostHogWrapper(settingsService, backend, eventContext);
	initAnalyticsIfEnabled(appSettings, posthog);

	return {
		homeDir,
		backend,
		settingsService,
		appSettings,
		language,
		posthog,
		eventContext,
	};
};
