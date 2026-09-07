<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { ExternallyResolvedPromise } from "$lib/utils/resolveExternally";
	const i18nMessages = useTranslations();

	type Props = {
		promise: ExternallyResolvedPromise<undefined>;
		log: (value: string) => void;
		value: string;
	};

	const { promise, log, value }: Props = $props();

	async function logfn() {
		let value2 = value;
		log(value2);
		await promise.promise;
		log(value);
		log(value2);
	}
</script>

<button onclick={logfn} type="button">{$i18nMessages.t("desktop:Child.log")}</button>
