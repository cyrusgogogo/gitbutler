import { InjectionToken } from "@gitbutler/core/context";
import {
	bindDocumentLanguage,
	createI18n,
	normalizePreference,
	resolveLocale,
	type LanguagePreference,
} from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/desktop";
import type { IBackend } from "$lib/backend";
import type { SettingsService } from "$lib/settings/appSettings";

export const LANGUAGE_SERVICE = new InjectionToken<DesktopLanguage>("DesktopLanguage");

export class DesktopLanguage {
	readonly i18n = createI18n(resources);
	private systemLocale: string | undefined;
	private preference: LanguagePreference = "system";

	constructor(
		private settings: SettingsService,
		private backend: IBackend,
	) {}

	async initialize(preference: LanguagePreference) {
		this.preference = preference;
		this.systemLocale = (await this.backend.getSystemLocale()) ?? undefined;
		this.i18n.setLocale(resolveLocale(preference, this.systemLocale));
	}

	/** Keep other windows and an OS language change in step without remounting the page. */
	start() {
		const unbind = bindDocumentLanguage(this.i18n, document);
		const unsubscribe = this.settings.subscribe((settings) => {
			if (!settings) return;
			this.preference = normalizePreference(settings.ui.language);
			this.i18n.setLocale(resolveLocale(this.preference, this.systemLocale));
			void this.backend.setMenuLocale(this.i18n.locale).catch(console.error);
		});
		const refresh = async () => {
			this.systemLocale = (await this.backend.getSystemLocale()) ?? undefined;
			this.i18n.setLocale(resolveLocale(this.preference, this.systemLocale));
			await this.backend.setMenuLocale(this.i18n.locale);
		};
		function onLanguageChange() {
			void refresh().catch(console.error);
		}
		window.addEventListener("languagechange", onLanguageChange);
		window.addEventListener("focus", onLanguageChange);
		return () => {
			unbind();
			unsubscribe();
			window.removeEventListener("languagechange", onLanguageChange);
			window.removeEventListener("focus", onLanguageChange);
		};
	}

	async set(preference: LanguagePreference): Promise<boolean> {
		const previous = this.preference;
		this.preference = preference;
		this.i18n.setLocale(resolveLocale(preference, this.systemLocale));
		try {
			await this.backend.setMenuLocale(this.i18n.locale);
			await this.settings.updateUi({ language: preference });
			return true;
		} catch (error) {
			this.preference = previous;
			this.i18n.setLocale(resolveLocale(previous, this.systemLocale));
			await this.backend.setMenuLocale(this.i18n.locale);
			throw error;
		}
	}
}
