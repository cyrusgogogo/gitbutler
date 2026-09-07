<script lang="ts" generics="A">
	import LoadingState from "$lib/network/LoadingState.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { Loadable } from "$lib/network/types";
	import type { Snippet } from "svelte";
	const i18nMessages = useTranslations();

	type Props<A> = {
		loadable?: Loadable<A>;
		children: Snippet<[A]>;
	};

	const { loadable, children }: Props<A> = $props();
</script>

{#if loadable === undefined}
	<span>{$i18nMessages.t("shared:Loading.uninitialized")}</span>
{:else if loadable.status === "found"}
	{@render children(loadable.value)}
{:else if loadable.status === "loading"}
	<LoadingState />
{:else if loadable.status === "not-found"}
	<span>{$i18nMessages.t("shared:Loading.notFound")}</span>
{:else if loadable.status === "error"}
	<span>{loadable.error.name}</span>
	<span>{loadable.error.message}</span>
{:else}
	<span>{$i18nMessages.t("shared:Loading.unknownState")}</span>
{/if}
