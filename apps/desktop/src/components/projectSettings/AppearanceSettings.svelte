<script lang="ts">
	import ThemeSelector from "$components/projectSettings/ThemeSelector.svelte";
	import { UI_STATE } from "$lib/state/uiState.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		CardGroup,
		HunkDiff,
		RadioButton,
		Select,
		SelectItem,
		Textbox,
		Toggle,
	} from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { LIGHT_THEMES, DARK_THEMES, setSyntaxThemes } from "@gitbutler/ui/utils/shikiHighlighter";
	import type { ScrollbarVisilitySettings } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const uiState = inject(UI_STATE);

	const pathFirst = uiState.global.pathFirst;
	const allInOneDiff = uiState.global.allInOneDiff;
	const highlightDiffs = uiState.global.highlightDiffs;
	const syntaxThemeLight = uiState.global.syntaxThemeLight;
	const syntaxThemeDark = uiState.global.syntaxThemeDark;
	const tabSize = uiState.global.tabSize;
	const diffLigatures = uiState.global.diffLigatures;
	const wrapText = uiState.global.wrapText;
	const diffFont = uiState.global.diffFont;
	const diffFontSize = uiState.global.diffFontSize;
	const strongContrast = uiState.global.strongContrast;
	const colorBlindFriendly = uiState.global.colorBlindFriendly;
	const inlineUnifiedDiffs = uiState.global.inlineUnifiedDiffs;
	const svgAsImage = uiState.global.svgAsImage;
	const scrollbarVisibilityState = uiState.global.scrollbarVisibilityState;
	const defaultFileListMode = uiState.global.defaultFileListMode;
	const MIN_DIFF_FONT_SIZE = 8;
	const MAX_DIFF_FONT_SIZE = 32;

	// Sync persisted syntax theme settings to the shiki highlighter.
	$effect(() => {
		setSyntaxThemes(syntaxThemeLight.current, syntaxThemeDark.current);
	});
	const diff = `@@ -56,10 +56,10 @@
			// Diff example
			projectName={project.title}
			{remoteBranches}
			on:branchSelected={async (e) => {
-				selectedBranch = e.detail;
-				if ($platformName === 'win32') {
+				if ($platformName === 'win64' && $userSettings.enableAdvancedFeatures) {
+					// Enhanced platform detection with feature flags
					setTarget();
				}
			}}`;

	function onScrollbarFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		const selectedScrollbarVisibility = formData.get(
			"scrollBarVisibilityType",
		) as ScrollbarVisilitySettings;

		scrollbarVisibilityState.set(selectedScrollbarVisibility);
	}

	function clampDiffFontSize(value: string) {
		if (value.trim() === "") return diffFontSize.current;

		const parsed = Number(value);
		if (!Number.isFinite(parsed)) return diffFontSize.current;

		return Math.round(Math.min(Math.max(parsed, MIN_DIFF_FONT_SIZE), MAX_DIFF_FONT_SIZE));
	}
</script>

<CardGroup.Item standalone>
	{#snippet title()}
		{$i18nMessages.t("desktop:AppearanceSettings.theme")}
	{/snippet}
	<ThemeSelector {uiState} />
</CardGroup.Item>

<CardGroup.Item alignment="center" standalone>
	{#snippet title()}
		{$i18nMessages.t("desktop:AppearanceSettings.defaultFileListMode")}
	{/snippet}
	{#snippet caption()}
		{$i18nMessages.t("desktop:AppearanceSettings.setTheDefaultFileListViewCanBe")}
	{/snippet}
	{#snippet actions()}
		<Select
			maxWidth={120}
			value={defaultFileListMode.current}
			options={[
				{ label: $i18nMessages.t("desktop:AppearanceSettings.inline694bbd757"), value: "list" },
				{ label: $i18nMessages.t("desktop:AppearanceSettings.inlinebaeb5de2c"), value: "tree" },
			]}
			onselect={(value) => {
				defaultFileListMode.set(value as "tree" | "list");
			}}
		>
			{#snippet itemSnippet({ item, highlighted })}
				<SelectItem selected={item.value === defaultFileListMode.current} {highlighted}>
					{item.label}
				</SelectItem>
			{/snippet}
		</Select>
	{/snippet}
</CardGroup.Item>

<CardGroup.Item labelFor="pathFirst" standalone>
	{#snippet title()}
		{$i18nMessages.t("desktop:AppearanceSettings.filePathFirst")}
	{/snippet}
	{#snippet caption()}
		{$i18nMessages.t("desktop:AppearanceSettings.displayTheFullFilePathBeforeTheFile")}
	{/snippet}
	{#snippet actions()}
		<Toggle
			id="pathFirst"
			checked={pathFirst.current}
			onclick={() => {
				pathFirst.set(!pathFirst.current);
			}}
		/>
	{/snippet}
</CardGroup.Item>

<CardGroup>
	<CardGroup.Item labelFor="allInOneDiff">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.allInOneDiff")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.showAScrollableListOfAllFileDiffs")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="allInOneDiff"
				checked={allInOneDiff.current}
				onclick={() => {
					allInOneDiff.set(!allInOneDiff.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>

	{#if allInOneDiff.current}
		<CardGroup.Item labelFor="highlightDiffs">
			{#snippet title()}
				{$i18nMessages.t("desktop:AppearanceSettings.highlightActiveDiff")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:AppearanceSettings.highlightTheCurrentlySelectedFileSDiffIn")}
			{/snippet}
			{#snippet actions()}
				<Toggle
					id="highlightDiffs"
					checked={highlightDiffs.current}
					onclick={() => {
						highlightDiffs.set(!highlightDiffs.current);
					}}
				/>
			{/snippet}
		</CardGroup.Item>
	{/if}
</CardGroup>

<CardGroup>
	<CardGroup.Item alignment="center">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.diffPreview")}
		{/snippet}

		<HunkDiff
			filePath="test.tsx"
			hunkStr={diff}
			{...uiState.pick(
				"tabSize",
				"wrapText",
				"diffFont",
				"diffFontSize",
				"diffLigatures",
				"strongContrast",
				"colorBlindFriendly",
				"inlineUnifiedDiffs",
			)}
		/>
	</CardGroup.Item>

	<CardGroup.Item alignment="center">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.syntaxThemeLight")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.colorSchemeUsedForSyntaxHighlightingWhenThe")}
		{/snippet}
		{#snippet actions()}
			<Select
				maxWidth={200}
				value={syntaxThemeLight.current}
				options={LIGHT_THEMES}
				onselect={(value) => {
					syntaxThemeLight.set(value);
				}}
			>
				{#snippet itemSnippet({ item, highlighted })}
					<SelectItem selected={item.value === syntaxThemeLight.current} {highlighted}>
						{item.label}
					</SelectItem>
				{/snippet}
			</Select>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item alignment="center">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.syntaxThemeDark")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t(
				"desktop:AppearanceSettings.colorSchemeUsedForSyntaxHighlightingWhenThe_a538bdb",
			)}
		{/snippet}
		{#snippet actions()}
			<Select
				maxWidth={200}
				value={syntaxThemeDark.current}
				options={DARK_THEMES}
				onselect={(value) => {
					syntaxThemeDark.set(value);
				}}
			>
				{#snippet itemSnippet({ item, highlighted })}
					<SelectItem selected={item.value === syntaxThemeDark.current} {highlighted}>
						{item.label}
					</SelectItem>
				{/snippet}
			</Select>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item>
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.fontFamily")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.setsTheFontForTheDiffViewThe")}
		{/snippet}

		<Textbox
			wide
			value={diffFont.current}
			required
			onchange={(value: string) => {
				diffFont.set(value);
			}}
		/>
	</CardGroup.Item>

	<CardGroup.Item alignment="center">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.fontSize")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.fontSizeOfTheCodeInTheDiff")}
		{/snippet}

		{#snippet actions()}
			<Textbox
				type="number"
				width={100}
				textAlign="center"
				value={diffFontSize.current.toString()}
				minVal={MIN_DIFF_FONT_SIZE}
				maxVal={MAX_DIFF_FONT_SIZE}
				showCountActions
				onchange={(value: string) => {
					diffFontSize.set(clampDiffFontSize(value));
				}}
				placeholder={diffFontSize.current.toString()}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="allowDiffLigatures">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.allowFontLigatures")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="allowDiffLigatures"
				checked={diffLigatures.current}
				onclick={() => {
					diffLigatures.set(!diffLigatures.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item alignment="center">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.tabSize")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.numberOfSpacesPerTabInTheDiff")}
		{/snippet}

		{#snippet actions()}
			<Textbox
				type="number"
				width={100}
				textAlign="center"
				value={tabSize.current.toString()}
				minVal={1}
				maxVal={8}
				showCountActions
				onchange={(value: string) => {
					tabSize.set(parseInt(value) || tabSize.current);
				}}
				placeholder={tabSize.current.toString()}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="wrapText">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.softWrap")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.softWrapLongLinesInTheDiffView")}
		{/snippet}

		{#snippet actions()}
			<Toggle
				id="wrapText"
				checked={wrapText.current}
				onclick={() => {
					wrapText.set(!wrapText.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="strongContrast">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.strongContrast")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.useStrongerContrastForAddedDeletedAndContext")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="strongContrast"
				checked={strongContrast.current}
				onclick={() => {
					strongContrast.set(!strongContrast.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="colorBlindFriendly">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.colorBlindFriendlyColors")}
		{/snippet}
		{#snippet caption()}
			{#snippet i18nSlot1()}<br />{/snippet}
			<I18nRichMessage
				value={{ key: "desktop:AppearanceSettings.useBlueAndOrangeColorsInsteadOfGreen" }}
				components={{ slot1: i18nSlot1 }}
			/>
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="colorBlindFriendly"
				checked={colorBlindFriendly.current}
				onclick={() => {
					colorBlindFriendly.set(!colorBlindFriendly.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="inlineUnifiedDiffs">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.displayWordDiffsInline")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.insteadOfSeparateLinesForRemovalsAndAdditions")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="inlineUnifiedDiffs"
				checked={inlineUnifiedDiffs.current}
				onclick={() => {
					inlineUnifiedDiffs.set(!inlineUnifiedDiffs.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="svgAsImage">
		{#snippet title()}
			{$i18nMessages.t("desktop:AppearanceSettings.previewSVGFilesAsImages")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AppearanceSettings.showSVGFileChangesAsAnImageDiff")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="svgAsImage"
				checked={svgAsImage.current}
				onclick={() => {
					svgAsImage.set(!svgAsImage.current);
				}}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>

<CardGroup>
	<form class="stack-v" onchange={(e) => onScrollbarFormChange(e.currentTarget)}>
		<CardGroup.Item labelFor="scrollbar-on-scroll">
			{#snippet title()}
				{$i18nMessages.t("desktop:AppearanceSettings.scrollbarOnScroll")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:AppearanceSettings.onlyShowTheScrollbarWhenYouAreScrolling")}
			{/snippet}
			{#snippet actions()}
				<RadioButton
					name="scrollBarVisibilityType"
					value="scroll"
					id="scrollbar-on-scroll"
					checked={scrollbarVisibilityState.current === "scroll"}
				/>
			{/snippet}
		</CardGroup.Item>

		<CardGroup.Item labelFor="scrollbar-on-hover">
			{#snippet title()}
				{$i18nMessages.t("desktop:AppearanceSettings.scrollbarOnHover")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:AppearanceSettings.showTheScrollbarOnlyWhenYouHoverOver")}
			{/snippet}
			{#snippet actions()}
				<RadioButton
					name="scrollBarVisibilityType"
					value="hover"
					id="scrollbar-on-hover"
					checked={scrollbarVisibilityState.current === "hover"}
				/>
			{/snippet}
		</CardGroup.Item>

		<CardGroup.Item labelFor="scrollbar-always">
			{#snippet title()}
				{$i18nMessages.t("desktop:AppearanceSettings.alwaysShowScrollbar")}
			{/snippet}
			{#snippet actions()}
				<RadioButton
					name="scrollBarVisibilityType"
					value="always"
					id="scrollbar-always"
					checked={scrollbarVisibilityState.current === "always"}
				/>
			{/snippet}
		</CardGroup.Item>
	</form>
</CardGroup>
