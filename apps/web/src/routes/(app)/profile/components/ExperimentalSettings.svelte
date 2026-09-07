<script lang="ts">
	import { featureShowOrganizations, featureShowProjectPage } from "$lib/featureFlags";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Spacer, Toggle } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();
</script>

<Spacer />

<div class="stack-v gap-8">
	<h2 class="text-15 text-bold">{$i18nMessages.t("web:ExperimentalSettings.experimental")}</h2>
	<p class="text-12 text-body clr-text-2">
		{#snippet i18nSlot1()}<br />{/snippet}
		<I18nRichMessage
			value={{
				key: "web:ExperimentalSettings.theseSettingsEnableExperimentalFeaturesThatAreStill",
			}}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>
</div>

<CardGroup>
	<CardGroup.Item labelFor="showOrganizations">
		{#snippet title()}{$i18nMessages.t("web:ExperimentalSettings.organizations")}{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:ExperimentalSettings.organizationsAreAWayOfLinkingTogetherProjects")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="showOrganizations"
				checked={$featureShowOrganizations}
				onclick={() => ($featureShowOrganizations = !$featureShowOrganizations)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="showProjectPage">
		{#snippet title()}{$i18nMessages.t(
				"web:ExperimentalSettings.userOrganizationProjectPages",
			)}{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:ExperimentalSettings.thisWillShowTheStubLandingPagesFor")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="showProjectPage"
				checked={$featureShowProjectPage}
				onclick={() => ($featureShowProjectPage = !$featureShowProjectPage)}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>
