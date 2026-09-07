<script lang="ts">
	import Child from "$components/test/change-during-async-sees-updates-two-components/Child.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { ExternallyResolvedPromise } from "$lib/utils/resolveExternally";
	const i18nMessages = useTranslations();

	type Props = {
		promise: ExternallyResolvedPromise<undefined>;
		log: (value: string) => void;
	};

	const { promise, log }: Props = $props();

	let value = $state("hello");
</script>

<Child {promise} {log} {value} />
<button onclick={() => (value = "world")} type="button"
	>{$i18nMessages.t("desktop:Component.updateState")}</button
>
