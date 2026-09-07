import { useQuery } from "@tanstack/react-query";
import { normalizePreference } from "@gitbutler/i18n";
import { LanguageSelect } from "@gitbutler/i18n/LanguageSelect";
import { guiSettingsQueryOptions } from "#ui/api/queries.ts";
import { useSaveGUISettings } from "#ui/api/mutations.ts";
import type { FC } from "react";

export const LanguageSetting: FC = () => {
	const { data } = useQuery({
		...guiSettingsQueryOptions,
		select: (settings) => settings.language,
	});
	const { mutateAsync: save } = useSaveGUISettings();
	return (
		<LanguageSelect
			value={normalizePreference(data)}
			onChange={async (language) => {
				await save({ language });
				return true;
			}}
		/>
	);
};
