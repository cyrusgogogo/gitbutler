import { Message as I18nMessage, useTranslations } from "@gitbutler/i18n/react";
import { Toggle, ToggleGroup } from "@base-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC } from "react";
import type { ThemeCollectionFilter } from "@pierre/theming";
import { themes } from "@pierre/theming/themes";
import type { ThemesType } from "@pierre/diffs/react";
import type { GUISettings } from "#electron/settings.ts";
import { guiSettingsQueryOptions } from "#ui/api/queries.ts";
import { useSaveGUISettings } from "#ui/api/mutations.ts";
import { Switch } from "#ui/components/Switch.tsx";
import { ToggleGroupStyles, ToggleStyles } from "#ui/components/ToggleGroup.tsx";
import { displayName } from "#ui/syntax-highlighting.ts";
import { defaultSettings } from "#ui/settings.ts";
import { Row, Section } from "./Section.tsx";

const getRenderableThemes = (filter?: ThemeCollectionFilter) =>
	themes
		.getThemes(filter)
		.map((theme) => ({
			name: theme.name,
			displayName: displayName(theme.name) ?? theme.displayName ?? theme.name,
		}))
		.toSorted((a, b) => a.displayName.localeCompare(b.displayName));

const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);

export const Appearance: FC = () => {
	const i18nMessages = useTranslations();
	const { data: settings } = useSuspenseQuery(guiSettingsQueryOptions);
	const { mutate: saveGUISettings } = useSaveGUISettings();

	const setSyntaxTheme = (variant: keyof ThemesType, themeName: string): void => {
		saveGUISettings({
			syntaxHighlighting: {
				light: variant === "light" ? themeName : settings.syntaxHighlighting?.light,
				dark: variant === "dark" ? themeName : settings.syntaxHighlighting?.dark,
			},
		});
	};

	const lightThemes = getRenderableThemes({ colorScheme: "light" });
	const darkThemes = getRenderableThemes({ colorScheme: "dark" });

	return (
		<>
			<Section>
				<Row label={i18nMessages.t("lite:Appearance.theme")} labelId="theme">
					<ToggleGroup
						aria-labelledby="theme"
						value={[settings.theme ?? defaultSettings.theme]}
						onValueChange={([theme]) => {
							if (theme !== undefined) saveGUISettings({ theme });
						}}
						render={<ToggleGroupStyles />}
					>
						<Toggle render={<ToggleStyles />} value="system">
							<I18nMessage value={{ key: "lite:Appearance.system" }} />{" "}
						</Toggle>
						<Toggle render={<ToggleStyles />} value="light">
							<I18nMessage value={{ key: "lite:Appearance.light" }} />{" "}
						</Toggle>
						<Toggle render={<ToggleStyles />} value="dark">
							<I18nMessage value={{ key: "lite:Appearance.dark" }} />{" "}
						</Toggle>
					</ToggleGroup>
				</Row>

				<Row
					label={i18nMessages.t("lite:Appearance.syntaxThemeLight")}
					htmlFor="syntax-theme-light"
				>
					<select
						id="syntax-theme-light"
						value={settings.syntaxHighlighting?.light ?? defaultSettings.syntaxHighlighting.light}
						onChange={(evt) => setSyntaxTheme("light", evt.currentTarget.value)}
					>
						{lightThemes.map((theme) => (
							<option key={theme.name} value={theme.name}>
								{theme.displayName}
							</option>
						))}
					</select>
				</Row>

				<Row label={i18nMessages.t("lite:Appearance.syntaxThemeDark")} htmlFor="syntax-theme-dark">
					<select
						id="syntax-theme-dark"
						value={settings.syntaxHighlighting?.dark ?? defaultSettings.syntaxHighlighting.dark}
						onChange={(evt) => setSyntaxTheme("dark", evt.currentTarget.value)}
					>
						{darkThemes.map((theme) => (
							<option key={theme.name} value={theme.name}>
								{theme.displayName}
							</option>
						))}
					</select>
				</Row>
			</Section>

			<Section heading={i18nMessages.t("lite:Appearance.files")}>
				<Row
					label={i18nMessages.t("lite:Appearance.filePathFirst")}
					labelId="path-first"
					hint={i18nMessages.t("lite:Appearance.leadEachRowWithTheDirectoryRatherThan")}
				>
					<Switch
						aria-labelledby="path-first"
						checked={settings.pathFirst ?? defaultSettings.pathFirst}
						onCheckedChange={(pathFirst) => saveGUISettings({ pathFirst })}
					/>
				</Row>
			</Section>

			<Section heading={i18nMessages.t("lite:Appearance.diff")}>
				<Row label={i18nMessages.t("lite:Appearance.diffFiles")} labelId="unidiff">
					<ToggleGroup
						aria-labelledby="unidiff"
						value={[String(settings.unidiff ?? defaultSettings.unidiff)]}
						onValueChange={([unidiff]) => {
							if (unidiff !== undefined) saveGUISettings({ unidiff: unidiff !== "false" });
						}}
						render={<ToggleGroupStyles />}
					>
						<Toggle render={<ToggleStyles />} value="true">
							<I18nMessage value={{ key: "lite:Appearance.allInOneDiff" }} />{" "}
						</Toggle>
						<Toggle render={<ToggleStyles />} value="false">
							<I18nMessage value={{ key: "lite:Appearance.selectedFileOnly" }} />{" "}
						</Toggle>
					</ToggleGroup>
				</Row>

				{/* These three are the diff toolbar's own controls: one stored value each, so
				    changing either surface moves the other. */}
				<Row
					label={i18nMessages.t("lite:Appearance.layout")}
					labelId="diff-style"
					hint={i18nMessages.t("lite:Appearance.alsoOnTheDiffToolbar")}
				>
					<ToggleGroup
						aria-labelledby="diff-style"
						value={[settings.diffStyle ?? defaultSettings.diffStyle]}
						onValueChange={([diffStyle]) => {
							if (diffStyle !== undefined)
								saveGUISettings({ diffStyle: diffStyle as GUISettings["diffStyle"] });
						}}
						render={<ToggleGroupStyles />}
					>
						<Toggle render={<ToggleStyles />} value="split">
							<I18nMessage value={{ key: "lite:Appearance.split" }} />{" "}
						</Toggle>
						<Toggle render={<ToggleStyles />} value="unified">
							<I18nMessage value={{ key: "lite:Appearance.unified" }} />{" "}
						</Toggle>
					</ToggleGroup>
				</Row>

				<Row
					label={i18nMessages.t("lite:Appearance.softWrap")}
					labelId="soft-wrap"
					hint={i18nMessages.t("lite:Appearance.wrapLongLinesInsteadOfScrollingThemSideways")}
				>
					<Switch
						aria-labelledby="soft-wrap"
						checked={(settings.diffOverflow ?? defaultSettings.diffOverflow) === "wrap"}
						onCheckedChange={(wrap) => saveGUISettings({ diffOverflow: wrap ? "wrap" : "scroll" })}
					/>
				</Row>

				<Row
					label={i18nMessages.t("lite:Appearance.diffBackgrounds")}
					labelId="diff-backgrounds"
					hint={i18nMessages.t("lite:Appearance.tintAddedAndRemovedLinesRatherThanMarking")}
				>
					<Switch
						aria-labelledby="diff-backgrounds"
						checked={settings.diffBackground ?? defaultSettings.diffBackground}
						onCheckedChange={(diffBackground) => saveGUISettings({ diffBackground })}
					/>
				</Row>

				<Row label={i18nMessages.t("lite:Appearance.fontFamily")} htmlFor="font-family">
					<input
						id="font-family"
						type="text"
						defaultValue={settings.diffFontFamily ?? defaultSettings.diffFontFamily}
						onBlur={(evt) => saveGUISettings({ diffFontFamily: evt.currentTarget.value })}
						onKeyDown={(evt) =>
							(evt.key === "Enter" || evt.key === "Escape") &&
							saveGUISettings({ diffFontFamily: evt.currentTarget.value })
						}
					/>
				</Row>

				<Row label={i18nMessages.t("lite:Appearance.fontSize")} htmlFor="font-size">
					<input
						id="font-size"
						type="number"
						min={1}
						max={32}
						defaultValue={settings.diffFontSize ?? defaultSettings.diffFontSize}
						onBlur={(evt) =>
							saveGUISettings({ diffFontSize: clamp(Number(evt.currentTarget.value), 1, 32) })
						}
						onKeyDown={(evt) =>
							(evt.key === "Enter" || evt.key === "Escape") &&
							saveGUISettings({ diffFontSize: clamp(Number(evt.currentTarget.value), 1, 32) })
						}
					/>
				</Row>

				<Row
					label={i18nMessages.t("lite:Appearance.fontLigatures")}
					labelId="ligatures"
					hint={i18nMessages.t("lite:Appearance.renderCombiningGlyphsSuchAsAndIfThe")}
				>
					<Switch
						aria-labelledby="ligatures"
						checked={settings.diffLigatures ?? defaultSettings.diffLigatures}
						onCheckedChange={(diffLigatures) => saveGUISettings({ diffLigatures })}
					/>
				</Row>

				<Row
					label={i18nMessages.t("lite:Appearance.highlightChangesWithinALine")}
					htmlFor="line-diff-type"
					hint={i18nMessages.t("lite:Appearance.howFinelyAChangedLineIsComparedAgainst")}
				>
					<select
						id="line-diff-type"
						value={settings.lineDiffType ?? defaultSettings.lineDiffType}
						onChange={(evt) =>
							saveGUISettings({
								lineDiffType: evt.currentTarget.value as GUISettings["lineDiffType"],
							})
						}
					>
						<option value="word-alt">
							<I18nMessage value={{ key: "lite:Appearance.words" }} />
						</option>
						<option value="word">
							<I18nMessage value={{ key: "lite:Appearance.wordsWhitespaceAware" }} />
						</option>
						<option value="char">
							<I18nMessage value={{ key: "lite:Appearance.characters" }} />
						</option>
						<option value="none">
							<I18nMessage value={{ key: "lite:Appearance.off" }} />
						</option>
					</select>
				</Row>

				<Row label={i18nMessages.t("lite:Appearance.tabSize")} htmlFor="tab-size">
					<input
						id="tab-size"
						type="number"
						min={1}
						max={8}
						defaultValue={settings.diffTabSize ?? defaultSettings.diffTabSize}
						onBlur={(evt) =>
							saveGUISettings({ diffTabSize: clamp(Number(evt.currentTarget.value), 1, 8) })
						}
						onKeyDown={(evt) =>
							(evt.key === "Enter" || evt.key === "Escape") &&
							saveGUISettings({ diffTabSize: clamp(Number(evt.currentTarget.value), 1, 8) })
						}
					/>
				</Row>
			</Section>
		</>
	);
};
