<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { ExternallyResolvedPromise } from "$lib/utils/resolveExternally";
	const i18nMessages = useTranslations();

	type Props = {
		promise: ExternallyResolvedPromise<undefined>;
		log: (value: string) => void;
	};

	const { promise, log }: Props = $props();

	let value = $state("hello");

	async function logfn() {
		log(value);
		await promise.promise;
		log(value);
	}
</script>

<button onclick={logfn} type="button">{$i18nMessages.t("desktop:Component.log")}</button>
<button onclick={() => (value = "world")} type="button"
	>{$i18nMessages.t("desktop:Component.updateState")}</button
>
