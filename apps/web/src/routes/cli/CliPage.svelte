<script lang="ts">
	import ComparisonTable from "./sections/ComparisonTable.svelte";
	import CtaSection from "./sections/CtaSection.svelte";
	import Features from "./sections/Features.svelte";
	import Hero from "./sections/Hero.svelte";
	import OptimizedForAgents from "./sections/OptimizedForAgents.svelte";
	import Footer from "$lib/components/marketing/Footer.svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
</script>

<svelte:head>
	<title>GitButler</title>
</svelte:head>

<Hero currentPage="cli">
	{#snippet descriptionContent()}
		{#snippet i18nSlot1(content: import("svelte").Snippet)}<a
				href="https://vcbench.dev/"
				target="_blank"
				rel="noopener noreferrer">{@render content()}</a
			>{/snippet}
		<I18nRichMessage
			value={{ key: "web:CliPage.agentsAre60FasterUsingGitButlerThanVanilla" }}
			components={{ slot1: i18nSlot1 }}
		/>
	{/snippet}
</Hero>
<Features />
<ComparisonTable />
<OptimizedForAgents />
<CtaSection />
<Footer />

<style lang="postcss">
	a {
		text-decoration: underline;
	}
</style>
