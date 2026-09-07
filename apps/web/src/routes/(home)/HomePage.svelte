<script lang="ts">
	import AiFeatures from "$home/sections/AiFeatures.svelte";
	import BlogHighlights from "$home/sections/BlogHighlights.svelte";
	import Changelog from "$home/sections/Changelog.svelte";
	import FeatureUpdates from "$home/sections/FeatureUpdates.svelte";
	import Hero from "$home/sections/Hero.svelte";
	import MainFeatures from "$home/sections/MainFeatures.svelte";
	import SocialQuotes from "$home/sections/SocialQuotes.svelte";
	import Footer from "$lib/components/marketing/Footer.svelte";
	import { getValidReleases } from "$lib/types/releases";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { onMount } from "svelte";
	const i18nMessages = useTranslations();

	let releases: any[] = $state([]);

	onMount(() => {
		// Fetch latest 10 releases for changelog
		fetch("https://app.gitbutler.com/api/downloads?limit=10&channel=release")
			.then((response) => response.json())
			.then((data) => {
				releases = getValidReleases(data);
			})
			.catch((error) => {
				console.error("Failed to fetch releases for changelog:", error);
			});
	});
</script>

<Hero>
	{#snippet descriptionContent()}
		{$i18nMessages.t("web:HomePage.gitButlerIsTheGitBackedChangeManagementTool")}
	{/snippet}
</Hero>
<MainFeatures />
<AiFeatures />
<FeatureUpdates />
<SocialQuotes />
<Changelog {releases} />
<BlogHighlights />
<Footer />
