<script lang="ts">
	import HomePage from "$home/HomePage.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const i18nMessages = useTranslations();
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerDesktop")}</title>
</svelte:head>

<HomePage />
