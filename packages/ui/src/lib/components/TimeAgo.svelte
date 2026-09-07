<script lang="ts">
	import Tooltip from "$lib/components/Tooltip.svelte";
	import { createTimeAgoStore, getAbsoluteTimestamp } from "$lib/utils/timeAgo";
	import { getI18n, useTranslations } from "@gitbutler/i18n/svelte";
	const i18n = getI18n();
	const translations = useTranslations();

	interface Props {
		date?: Date;
		addSuffix?: boolean;
		showTooltip?: boolean;
		capitalize?: boolean;
	}

	const { date, addSuffix, showTooltip = true, capitalize = false }: Props = $props();
	const store = $derived(createTimeAgoStore(date, addSuffix, i18n));
	const absoluteTime = $derived(date ? getAbsoluteTimestamp(date, $translations.locale) : "");

	function formatText(value: string | undefined): string {
		if (!value) return "";
		if (!capitalize) return value;
		return `${value[0].toUpperCase()}${value.slice(1)}`;
	}
</script>

{#if store}
	{#if showTooltip && date}
		<Tooltip text={absoluteTime}>
			<span>{formatText($store)}</span>
		</Tooltip>
	{:else}
		{formatText($store)}
	{/if}
{/if}
