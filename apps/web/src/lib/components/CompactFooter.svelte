<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();
</script>

<footer class="footer text-12">
	<span>{$i18nMessages.t("web:CompactFooter.gitButler2025")}</span>

	<div class="footer-links">
		{#snippet i18nSlot2(content: import("svelte").Snippet)}<a
				class="footer-link"
				target="_blank"
				href="https://docs.gitbutler.com/">{@render content()}</a
			>{/snippet}
		{#snippet i18nSlot3(content: import("svelte").Snippet)}<a
				class="footer-link"
				target="_blank"
				href="https://discord.com/invite/MmFkmaJ42D">{@render content()}</a
			>{/snippet}
		{#snippet i18nSlot4(content: import("svelte").Snippet)}<a class="footer-link" href="/downloads"
				>{@render content()}</a
			>{/snippet}
		<I18nRichMessage
			value={{ key: "web:CompactFooter.docsDiscordDownloads" }}
			components={{ slot2: i18nSlot2, slot3: i18nSlot3, slot4: i18nSlot4 }}
		/>
	</div>

	<div class="footer-links">
		{#snippet i18nSlot5(content: import("svelte").Snippet)}<a
				class="footer-link underline"
				href="https://gitbutler.com/privacy"
				target="_blank">{@render content()}</a
			>{/snippet}
		{#snippet i18nSlot6(content: import("svelte").Snippet)}<span>{@render content()}</span
			>{/snippet}
		{#snippet i18nSlot7(content: import("svelte").Snippet)}<a
				class="footer-link underline"
				href="https://gitbutler.com/terms"
				target="_blank">{@render content()}</a
			>{/snippet}
		<I18nRichMessage
			value={{ key: "web:CompactFooter.privacyPolicyTermsOfService" }}
			components={{ slot5: i18nSlot5, slot6: i18nSlot6, slot7: i18nSlot7 }}
		/>
	</div>
</footer>

<style lang="postcss">
	.footer {
		display: flex;
		grid-column: full-start / full-end;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		padding: 20px 0 24px;
		gap: 12px 24px;
		color: var(--text-2);
	}

	.footer-links {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.footer-link {
		display: flex;
		align-items: center;
		gap: 2px;
		color: var(--text-2);
		transition: color var(--transition-fast);

		&:hover {
			color: var(--text-1);
		}
	}
</style>
