<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { LocalizedText } from "@gitbutler/i18n";
	const { value }: { value: LocalizedText } = $props();
	const translations = useTranslations();
</script>

{$translations.text(value)}
