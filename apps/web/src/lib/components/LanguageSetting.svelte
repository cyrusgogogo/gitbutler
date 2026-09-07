<script lang="ts">
	import { getLanguage } from "$lib/i18n";
	import LanguageSelect from "@gitbutler/ui/i18n/LanguageSelect.svelte";
	import { readable } from "svelte/store";
	const language = getLanguage();
	const preference = readable(language.preference, (set) =>
		language.subscribe(() => set(language.preference)),
	);
</script>

<LanguageSelect value={$preference} onchange={(value) => language.set(value)} />
