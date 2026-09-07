<script lang="ts">
	import BitbucketIntegration from "$components/settings/BitbucketIntegration.svelte";
	import GithubIntegration from "$components/settings/GithubIntegration.svelte";
	import GitlabIntegration from "$components/settings/GitlabIntegration.svelte";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Spacer, Toggle } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const settingsService = inject(SETTINGS_SERVICE);
	const appSettings = settingsService.appSettings;

	async function toggleAutoFillPrDescription() {
		await settingsService.updateReviews({
			autoFillPrDescriptionFromCommit: !$appSettings?.reviews.autoFillPrDescriptionFromCommit,
		});
	}
</script>

<GithubIntegration />
<GitlabIntegration />
<BitbucketIntegration />
<Spacer />
<CardGroup>
	<CardGroup.Item labelFor="autoFillPrDescription">
		{#snippet title()}
			{$i18nMessages.t("desktop:IntegrationsSettings.autoFillPRMRDescriptionsFromCommit")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:IntegrationsSettings.setTheTitleAndDescriptionFromTheCommit")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="autoFillPrDescription"
				checked={$appSettings?.reviews.autoFillPrDescriptionFromCommit ?? true}
				onclick={toggleAutoFillPrDescription}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>
