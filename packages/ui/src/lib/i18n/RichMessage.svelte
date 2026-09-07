<script lang="ts">
	import { getI18n, useTranslations } from "@gitbutler/i18n/svelte";
	import type { MessageDescriptor, MessagePart } from "@gitbutler/i18n";
	import type { Snippet } from "svelte";
	const {
		value,
		components = {},
	}: {
		value: MessageDescriptor;
		components?: Record<string, Snippet<[Snippet]>>;
	} = $props();
	const i18n = getI18n();
	const translations = useTranslations();
	const parts = $derived.by(() => {
		// The locale store makes queued messages reactive without mutating their payloads.
		void $translations.locale;
		return i18n.parts(value);
	});
</script>

{#snippet renderParts(items: MessagePart[])}
	{#each items as part, index (index)}
		{#if part.type === "text"}
			{part.text}
		{:else}
			{#snippet children()}{@render renderParts(part.children)}{/snippet}
			{#if components[part.name]}
				{@render components[part.name]!(children)}
			{:else}
				{@render children()}
			{/if}
		{/if}
	{/each}
{/snippet}

{@render renderParts(parts)}
