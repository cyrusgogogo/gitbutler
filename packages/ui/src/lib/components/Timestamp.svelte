<script lang="ts">
	import Tooltip from "$lib/components/Tooltip.svelte";
	import { createTimestampStore, getAbsoluteTimestamp } from "$lib/utils/timeAgo";
	import { getI18n, useTranslations } from "@gitbutler/i18n/svelte";
	const i18n = getI18n();
	const translations = useTranslations();

	interface Props {
		date?: string | Date;
		showTooltip?: boolean;
		showSeconds?: boolean;
	}

	const parsedDate = $derived.by(() => {
		if (typeof date === "string") {
			if (date.endsWith("Z")) return new Date(date);
			return new Date(date + "Z");
		}
		return date;
	});
	const { date, showTooltip = true }: Props = $props();
	const store = $derived(createTimestampStore(parsedDate, i18n));
	const absoluteTime = $derived(getAbsoluteTimestamp(parsedDate, $translations.locale));
</script>

{#if store}
	{#if showTooltip && date}
		<Tooltip text={absoluteTime}>
			<span>{$store}</span>
		</Tooltip>
	{:else}
		{$store}
	{/if}
{/if}
