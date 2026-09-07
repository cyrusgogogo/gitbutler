import { useEffect, type FC } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizePreference, resolveLocale } from "@gitbutler/i18n";
import { i18n } from "#ui/i18n.ts";
import { guiSettingsQueryOptions } from "#ui/api/queries.ts";

/** Subscribe to language only; other settings never invalidate translated rows. */
export const LanguageSync: FC = () => {
	const client = useQueryClient();
	const { data: preference } = useQuery({
		...guiSettingsQueryOptions,
		select: (settings) => settings.language,
	});
	useEffect(
		() =>
			window.lite.onGUISettingsChange((settings) => {
				client.setQueryData(guiSettingsQueryOptions.queryKey, settings);
			}),
		[client],
	);
	useEffect(() => {
		let active = true;
		const refresh = () => {
			void window.lite.getSystemLocale().then((locale) => {
				if (active) i18n.setLocale(resolveLocale(normalizePreference(preference), locale));
			});
		};
		refresh();
		window.addEventListener("languagechange", refresh);
		window.addEventListener("focus", refresh);
		return () => {
			active = false;
			window.removeEventListener("languagechange", refresh);
			window.removeEventListener("focus", refresh);
		};
	}, [preference]);
	return null;
};
