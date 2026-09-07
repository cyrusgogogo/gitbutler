<script lang="ts">
	import { provideI18n } from "@gitbutler/i18n/svelte";
	import EmailTextbox from "@gitbutler/ui/components/EmailTextbox.svelte";
	import { untrack } from "svelte";
	import type { I18n } from "@gitbutler/i18n";
	const { i18n }: { i18n: I18n } = $props();
	provideI18n(untrack(() => i18n));
	let draft = $state("an-invalid-email");
</script>

<EmailTextbox bind:value={draft} label="Email" />
