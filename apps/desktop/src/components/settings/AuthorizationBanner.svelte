<script lang="ts">
	import GoToSettingsButton from "$components/settings/GoToSettingsButton.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Icon } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		title?: string;
		message?: string;
	}

	const { title: providedTitleLabel, message: providedMessage }: Props = $props();
	const message = $derived(
		providedMessage ?? $i18nMessages.t("desktop:AuthorizationBanner.defaultd4a709561"),
	);
	const titleLabel = $derived(
		providedTitleLabel ?? $i18nMessages.t("desktop:AuthorizationBanner.default5cd9ae36f"),
	);
</script>

<CardGroup>
	<CardGroup.Item>
		{#snippet iconSide()}
			<Icon name="warning" color="var(--fill-warn-bg)" />
		{/snippet}
		{#snippet title()}
			{titleLabel}
		{/snippet}
		{#snippet caption()}
			{message}
		{/snippet}
		{#snippet actions()}
			<GoToSettingsButton />
		{/snippet}
	</CardGroup.Item>
</CardGroup>
