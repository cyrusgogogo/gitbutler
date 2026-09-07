import { useTranslations } from "@gitbutler/i18n/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { guiSettingsQueryOptions } from "#ui/api/queries.ts";
import { useSaveGUISettings } from "#ui/api/mutations.ts";
import { Switch } from "#ui/components/Switch.tsx";
import { defaultSettings } from "#ui/settings.ts";
import { Row, Section } from "./Section.tsx";

export const Experimental: FC = () => {
	const i18nMessages = useTranslations();
	const { data: settings } = useSuspenseQuery(guiSettingsQueryOptions);
	const { mutate: saveGUISettings } = useSaveGUISettings();

	return (
		<Section>
			<Row
				label={i18nMessages.t("lite:Experimental.commentAnnotations")}
				labelId="comment-annotations"
				hint={i18nMessages.t("lite:Experimental.addCommentsToDiffLinesAndCopyThem")}
			>
				<Switch
					aria-labelledby="comment-annotations"
					checked={settings.commentAnnotations ?? defaultSettings.commentAnnotations}
					onCheckedChange={(commentAnnotations) => saveGUISettings({ commentAnnotations })}
				/>
			</Row>

			<Row
				label={i18nMessages.t("lite:Experimental.previewOperationsWhileDragging")}
				labelId="dry-run-operations"
				hint={i18nMessages.t("lite:Experimental.dryRunsADragAndDropBeforeIt")}
			>
				<Switch
					aria-labelledby="dry-run-operations"
					checked={settings.dryRunOperations ?? defaultSettings.dryRunOperations}
					onCheckedChange={(dryRunOperations) => saveGUISettings({ dryRunOperations })}
				/>
			</Row>

			<Row
				label={i18nMessages.t("lite:Experimental.minimap")}
				labelId="minimap"
				hint={i18nMessages.t("lite:Experimental.aMapOfTheDiffDownTheRight")}
			>
				<Switch
					aria-labelledby="minimap"
					checked={settings.minimap ?? defaultSettings.minimap}
					onCheckedChange={(minimap) => saveGUISettings({ minimap })}
				/>
			</Row>
		</Section>
	);
};
