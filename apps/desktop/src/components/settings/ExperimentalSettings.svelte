<script lang="ts">
	import { fModeEnabled } from "$lib/config/uiFeatureFlags";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";

	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Toggle } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	const settingsService = inject(SETTINGS_SERVICE);
	const settingsStore = settingsService.appSettings;
</script>

<p class="text-12 text-body experimental-settings__text">
	{#snippet i18nSlot1()}<br />{/snippet}
	<I18nRichMessage
		value={{ key: "desktop:ExperimentalSettings.flagsForFeaturesInDevelopmentOrBetaFeatures" }}
		components={{ slot1: i18nSlot1 }}
	/>
</p>

<CardGroup>
	<CardGroup.Item labelFor="f-mode">
		{#snippet title()}
			{$i18nMessages.t("desktop:ExperimentalSettings.fModeNavigation")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:ExperimentalSettings.enableFModeForQuickKeyboardNavigationTo")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="f-mode"
				checked={$fModeEnabled}
				onclick={() => fModeEnabled.set(!$fModeEnabled)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="single-branch">
		{#snippet title()}
			{$i18nMessages.t("desktop:ExperimentalSettings.singleBranchMode")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:ExperimentalSettings.stayInTheWorkspaceViewWhenLeavingThe")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="single-branch"
				checked={$settingsStore?.featureFlags.singleBranch}
				onclick={() =>
					settingsService.updateFeatureFlags({
						singleBranch: !$settingsStore?.featureFlags.singleBranch,
					})}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="worktree-manipulation">
		{#snippet title()}
			{$i18nMessages.t("desktop:ExperimentalSettings.worktreeManipulation")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t(
				"desktop:ExperimentalSettings.enableExperimentalSupportForWorkingWithLinkedGit",
			)}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="worktree-manipulation"
				checked={$settingsStore?.featureFlags.worktreeManipulation}
				onclick={() =>
					settingsService.updateFeatureFlags({
						worktreeManipulation: !$settingsStore?.featureFlags.worktreeManipulation,
					})}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>

<style>
	.experimental-settings__text {
		margin-bottom: 10px;
		color: var(--text-2);
	}
</style>
