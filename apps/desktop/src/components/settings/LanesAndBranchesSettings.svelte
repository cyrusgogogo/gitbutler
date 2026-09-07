<script lang="ts">
	import {
		autoSelectBranchNameFeature,
		autoSelectBranchCreationFeature,
		stagingBehaviorFeature,
		type StagingBehavior,
	} from "$lib/config/uiFeatureFlags";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { persisted } from "@gitbutler/shared/persisted";
	import { CardGroup, RadioButton, Toggle, Spacer } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	const addToLeftmost = persisted<boolean>(false, "branch-placement-leftmost");
	function onStagingBehaviorFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		const selectedStagingBehavior = formData.get("stagingBehaviorType") as StagingBehavior | null;
		if (!selectedStagingBehavior) return;
		stagingBehaviorFeature.set(selectedStagingBehavior);
	}
</script>

<CardGroup.Item standalone labelFor="add-leftmost">
	{#snippet title()}
		{$i18nMessages.t("desktop:LanesAndBranchesSettings.placeNewLanesOnTheLeftSide")}
	{/snippet}
	{#snippet caption()}
		{$i18nMessages.t("desktop:LanesAndBranchesSettings.byDefaultNewLanesAreAddedToThe")}
	{/snippet}
	{#snippet actions()}
		<Toggle
			id="add-leftmost"
			checked={$addToLeftmost}
			onclick={() => ($addToLeftmost = !$addToLeftmost)}
		/>
	{/snippet}
</CardGroup.Item>

<CardGroup>
	<CardGroup.Item labelFor="auto-select-creation">
		{#snippet title()}
			{$i18nMessages.t("desktop:LanesAndBranchesSettings.autoSelectTextOnBranchCreation")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t(
				"desktop:LanesAndBranchesSettings.automaticallySelectThePrePopulatedTextInThe",
			)}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="auto-select-creation"
				checked={$autoSelectBranchCreationFeature}
				onclick={() => ($autoSelectBranchCreationFeature = !$autoSelectBranchCreationFeature)}
			/>
		{/snippet}
	</CardGroup.Item>
	<CardGroup.Item labelFor="auto-select-rename">
		{#snippet title()}
			{$i18nMessages.t("desktop:LanesAndBranchesSettings.autoSelectTextOnBranchRename")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t(
				"desktop:LanesAndBranchesSettings.automaticallySelectTheTextWhenRenamingABranch",
			)}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="auto-select-rename"
				checked={$autoSelectBranchNameFeature}
				onclick={() => ($autoSelectBranchNameFeature = !$autoSelectBranchNameFeature)}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>

<Spacer />

<div class="stack-v gap-8">
	<h2 class="text-15 text-bold">
		{$i18nMessages.t("desktop:LanesAndBranchesSettings.commitStagingBehavior")}
	</h2>
	<p class="text-12 text-body clr-text-2">
		{#snippet i18nSlot1()}<br />{/snippet}
		<I18nRichMessage
			value={{
				key: "desktop:LanesAndBranchesSettings.controlsWhichFilesArePreSelectedWhenOpening",
			}}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>
</div>

<CardGroup>
	<form class="stack-v" onchange={(e) => onStagingBehaviorFormChange(e.currentTarget)}>
		<CardGroup.Item labelFor="stage-all">
			{#snippet title()}
				{$i18nMessages.t("desktop:LanesAndBranchesSettings.autoSelectAllAssignedFiles")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:LanesAndBranchesSettings.preSelectsAllFilesAssignedToThisBranch")}
			{/snippet}
			{#snippet actions()}
				<RadioButton
					name="stagingBehaviorType"
					value="all"
					id="stage-all"
					checked={$stagingBehaviorFeature === "all"}
				/>
			{/snippet}
		</CardGroup.Item>

		<CardGroup.Item labelFor="stage-selection">
			{#snippet title()}
				{$i18nMessages.t("desktop:LanesAndBranchesSettings.autoSelectOnlyYourPickedFiles")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:LanesAndBranchesSettings.preSelectsOnlyTheFilesYouHaveAlready")}
			{/snippet}
			{#snippet actions()}
				<RadioButton
					name="stagingBehaviorType"
					value="selection"
					id="stage-selection"
					checked={$stagingBehaviorFeature === "selection"}
				/>
			{/snippet}
		</CardGroup.Item>

		<CardGroup.Item labelFor="stage-none">
			{#snippet title()}
				{$i18nMessages.t("desktop:LanesAndBranchesSettings.noAutoSelection")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t(
					"desktop:LanesAndBranchesSettings.nothingIsPreSelectedYouManuallyPickWhat",
				)}
			{/snippet}
			{#snippet actions()}
				<RadioButton
					name="stagingBehaviorType"
					value="none"
					id="stage-none"
					checked={$stagingBehaviorFeature === "none"}
				/>
			{/snippet}
		</CardGroup.Item>
	</form>
</CardGroup>
