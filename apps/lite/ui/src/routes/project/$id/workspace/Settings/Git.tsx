import { useTranslations } from "@gitbutler/i18n/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useState, type FC } from "react";
import * as ms from "ms";
import { guiSettingsQueryOptions } from "#ui/api/queries.ts";
import { useSaveGUISettings } from "#ui/api/mutations.ts";
import { clampAutoFetch, defaultSettings } from "#ui/settings.ts";
import { formatDuration } from "#ui/time.ts";
import { Row, Section } from "./Section.tsx";

export const Git: FC = () => {
	const i18nMessages = useTranslations();
	const { data: settings } = useSuspenseQuery(guiSettingsQueryOptions);
	const { mutate: saveGUISettings } = useSaveGUISettings();

	const [autofetch, setAutofetch] = useState(
		settings.autoFetchFrequency ?? defaultSettings.autoFetchFrequency,
	);
	const deferredAutofetch = useDeferredValue(autofetch);

	// Throws on empty and large strings.
	let parsedAutofetch: number;
	try {
		parsedAutofetch = ms.parse(deferredAutofetch);
	} catch {
		parsedAutofetch = Number.NaN;
	}

	const isValidAutofetch = !Number.isNaN(parsedAutofetch);

	return (
		<Section>
			<Row
				label={i18nMessages.t("lite:Git.autoFetchFrequency")}
				htmlFor="autofetch"
				hint={
					isValidAutofetch
						? formatDuration(clampAutoFetch(parsedAutofetch), i18nMessages.locale)
						: i18nMessages.t("lite:Git.disabled")
				}
			>
				<input
					id="autofetch"
					type="text"
					value={autofetch}
					onChange={(evt) => setAutofetch(evt.currentTarget.value)}
					onBlur={(evt) => saveGUISettings({ autoFetchFrequency: evt.currentTarget.value })}
					onKeyDown={(evt) =>
						(evt.key === "Enter" || evt.key === "Escape") &&
						saveGUISettings({ autoFetchFrequency: evt.currentTarget.value })
					}
				/>
			</Row>
		</Section>
	);
};
