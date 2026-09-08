import { Message as I18nMessage, useTranslations } from "@gitbutler/i18n/react";
import { useSuspenseQueries } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FC } from "react";
import {
	guiSettingsQueryOptions,
	listEditorsQueryOptions,
	listProjectsQueryOptions,
	terminalsQueryOptions,
} from "#ui/api/queries.ts";
import { useDeleteAllData, useSaveGUISettings } from "#ui/api/mutations.ts";
import { getButtonClassName } from "#ui/components/Button.tsx";
import { defaultSettings } from "#ui/settings.ts";
import styles from "./General.module.css";
import { Row, Section } from "./Section.tsx";
import { LanguageSetting } from "#ui/LanguageSetting.tsx";

export const General: FC = () => {
	const i18nMessages = useTranslations();
	const [{ data: editors }, { data: terminals }, { data: settings }, { data: projects }] =
		useSuspenseQueries({
			queries: [
				listEditorsQueryOptions,
				terminalsQueryOptions,
				guiSettingsQueryOptions,
				listProjectsQueryOptions,
			],
		});
	const { mutate: saveGUISettings } = useSaveGUISettings();
	const { isPending: isRemoving, mutate: deleteAllData } = useDeleteAllData();
	const navigate = useNavigate();

	const [confirmingRemoveAll, setConfirmingRemoveAll] = useState(false);

	const removeAllProjects = () =>
		deleteAllData(undefined, {
			// Every route below /project is gone, so leave before one notices.
			onSuccess: () => void navigate({ to: "/" }),
		});

	return (
		<>
			<Section>
				<LanguageSetting />
			</Section>

			<Section>
				<Row label={i18nMessages.t("lite:General.defaultEditor")} htmlFor="editor">
					<select
						id="editor"
						value={settings.editorId ?? ""}
						onChange={(evt) => saveGUISettings({ editorId: evt.currentTarget.value })}
					>
						<option value="" disabled>
							<I18nMessage value={{ key: "lite:General.selectAnEditor" }} />
						</option>
						{editors.map((editor) => (
							<option key={editor.id} value={editor.id}>
								{editor.name}
							</option>
						))}
					</select>
				</Row>

				<Row label={i18nMessages.t("lite:General.defaultTerminal")} htmlFor="terminal">
					<select
						id="terminal"
						value={settings.terminalId ?? ""}
						onChange={(evt) => saveGUISettings({ terminalId: evt.currentTarget.value })}
					>
						<option value="" disabled>
							<I18nMessage value={{ key: "lite:General.selectATerminal" }} />
						</option>
						{terminals.map((terminal) => (
							<option key={terminal.identifier} value={terminal.identifier}>
								{terminal.displayName}
							</option>
						))}
					</select>
				</Row>

				<Row
					label={i18nMessages.t("lite:General.pullRequestActivity")}
					htmlFor="pr-notifications"
					hint={i18nMessages.t("lite:General.loudCollectsNotificationsInTheBellQuietKeeps")}
				>
					<select
						id="pr-notifications"
						value={settings.prNotifications ?? defaultSettings.prNotifications}
						onChange={(evt) => {
							const value = evt.currentTarget.value;
							if (value === "loud" || value === "quiet" || value === "off")
								saveGUISettings({ prNotifications: value });
						}}
					>
						<option value="loud">
							<I18nMessage value={{ key: "lite:General.loud" }} />
						</option>
						<option value="quiet">
							<I18nMessage value={{ key: "lite:General.quiet" }} />
						</option>
						<option value="off">
							<I18nMessage value={{ key: "lite:General.off" }} />
						</option>
					</select>
				</Row>
			</Section>

			<Section heading={i18nMessages.t("lite:General.dangerZone")}>
				<Row
					label={i18nMessages.t("lite:General.removeAllProjects")}
					hint={i18nMessages.t("lite:General.forgetsAllValueOfThemTheRepositoriesOn", {
						value: projects.length,
					})}
				>
					{confirmingRemoveAll ? (
						<div className={styles.confirm}>
							<button
								type="button"
								className={getButtonClassName({ variant: "danger", size: "small" })}
								disabled={isRemoving}
								onClick={removeAllProjects}
							>
								{isRemoving ? (
									<I18nMessage value={{ key: "lite:General.removing" }} />
								) : (
									<I18nMessage value={{ key: "lite:General.confirm" }} />
								)}
							</button>
							<button
								type="button"
								className={getButtonClassName({ size: "small" })}
								disabled={isRemoving}
								onClick={() => setConfirmingRemoveAll(false)}
							>
								<I18nMessage value={{ key: "lite:General.cancel" }} />
							</button>
						</div>
					) : (
						<button
							type="button"
							className={getButtonClassName({ variant: "danger", size: "small" })}
							disabled={projects.length === 0}
							onClick={() => setConfirmingRemoveAll(true)}
						>
							<I18nMessage value={{ key: "lite:General.removeAll" }} />
						</button>
					)}
				</Row>
			</Section>
		</>
	);
};
