<script lang="ts">
	import featuresJson from "../features.json";
	import Features from "$home/components/Features.svelte";
	import SectionHeader from "$home/components/SectionHeader.svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
</script>

<section class="cli-features">
	{#snippet i18nHeadingSlot(content: import("svelte").Snippet)}<i>{@render content()}</i>{/snippet}
	<SectionHeader>
		<I18nRichMessage
			value={{ key: "web:Features.everythingYouWishedGitHad" }}
			components={{ slot1: i18nHeadingSlot }}
		/>
	</SectionHeader>
	<Features items={featuresJson} noMargin />
</section>

<style>
	.cli-features {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: full-start / full-end;
	}
</style>
