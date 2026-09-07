<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { env } from "$env/dynamic/public";
	const i18nMessages = useTranslations();
</script>

<div class="supporter-card">
	<h3 class="text-15 text-bold">
		{$i18nMessages.t("web:SupporterCard.thankYouForBeingASupporter")}
	</h3>
	<p class="text-12 text-body clr-text-2">
		{#snippet i18nSlot1()}<br />{/snippet}
		<I18nRichMessage
			value={{ key: "web:SupporterCard.yourSupportHelpsUsBuildABetterGitButler" }}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>
	<Button
		style="pop"
		onclick={() => (window.location.href = `${env.PUBLIC_APP_HOST}supporter/portal`)}
	>
		{$i18nMessages.t("web:SupporterCard.manageYourSubscription")}
	</Button>
</div>

<style lang="postcss">
	.supporter-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 16px;
		gap: 12px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
		background-color: var(--bg-1);
	}
</style>
