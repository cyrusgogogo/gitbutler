<script lang="ts">
	import AiPromptSelect from "$components/projectSettings/AIPromptSelect.svelte";

	import SettingsSection from "$components/shared/SettingsSection.svelte";
	import { projectAiGenEnabled } from "$lib/config/config";
	import { useSettingsModal } from "$lib/settings/settingsModal.svelte";

	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, CardGroup, Spacer, Toggle } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId: string } = $props();

	const { openGeneralSettings } = useSettingsModal();

	const aiGenEnabled = $derived(projectAiGenEnabled(projectId));
</script>

<SettingsSection>
	{#snippet description()}
		{$i18nMessages.t("desktop:CloudForm.gitButlerSupportsTheUseOfOpenAIAndAnthropic")}
	{/snippet}

	<Spacer />

	<CardGroup>
		<CardGroup.Item labelFor="aiGenEnabled">
			{#snippet title()}
				{$i18nMessages.t("desktop:CloudForm.enableBranchAndCommitMessageGeneration")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:CloudForm.ifEnabledDiffsWillBeSentToOpenAI")}
			{/snippet}
			{#snippet actions()}
				<Toggle
					id="aiGenEnabled"
					checked={$aiGenEnabled}
					onclick={() => {
						$aiGenEnabled = !$aiGenEnabled;
					}}
				/>
			{/snippet}
		</CardGroup.Item>
	</CardGroup>

	<CardGroup>
		<CardGroup.Item>
			{#snippet title()}
				{$i18nMessages.t("desktop:CloudForm.customPrompts")}
			{/snippet}

			<AiPromptSelect {projectId} promptUse="commits" />
			<AiPromptSelect {projectId} promptUse="branches" />

			<Spacer margin={8} />

			<p class="text-12 text-body">
				{$i18nMessages.t("desktop:CloudForm.youCanApplyYourOwnCustomPromptsTo")}
			</p>
			<Button kind="outline" icon="edit" onclick={() => openGeneralSettings("ai")}
				>{$i18nMessages.t("desktop:CloudForm.customizePrompts")}</Button
			>
		</CardGroup.Item>
	</CardGroup>
</SettingsSection>
