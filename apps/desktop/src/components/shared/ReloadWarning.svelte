<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { InfoMessage } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	// Number of events received.
	let count = $state(0);

	/**
	 * Listens for custom events sent by vite, defined in `vite.config.ts`.
	 * See: https://vite.dev/guide/api-plugin.html#typescript-for-custom-events
	 */
	import.meta.hot?.on("gb:reload", () => {
		count++;
	});
</script>

{#if count > 0}
	<div class="reload-warning">
		<InfoMessage style="warning">
			{#snippet title()}
				{$i18nMessages.t("desktop:ReloadWarning.fullReloadPending")}
			{/snippet}
			{#snippet content()}
				{$i18nMessages.t("desktop:ReloadWarning.detectedValueEventsThatRequireReloadingThisPage", {
					count: String(count),
				})}
			{/snippet}
		</InfoMessage>
	</div>
{/if}

<style lang="postcss">
	.reload-warning {
		z-index: var(--z-lifted);
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
	}
</style>
