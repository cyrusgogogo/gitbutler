<script lang="ts">
	import CtaButtons from "../components/CtaButtons.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();
</script>

<section class="cta-section">
	<div class="cta-section__content">
		<div class="chip-free-opensource text-15 text-semibold">
			{$i18nMessages.t("web:CtaSection.freeAndOpenSource")}
		</div>
		<h2 class="cta-section__header">
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<i>{@render content()}</i>{/snippet}
			<I18nRichMessage
				value={{ key: "web:CtaSection.readyToLevelUpYourWorkflow" }}
				components={{ slot1: i18nSlot1 }}
			/>
		</h2>
		<p class="cta-section__description text-16 text-body">
			{#snippet i18nSlot2()}<br />{/snippet}
			<I18nRichMessage
				value={{ key: "web:CtaSection.joinThousandsOfDevelopersWhoVeAlreadyMade" }}
				components={{ slot2: i18nSlot2 }}
			/>
		</p>

		<CtaButtons darkMode />
	</div>

	<div class="grainy-bg grainy-1"></div>
	<div class="grainy-bg grainy-2"></div>
</section>

<style>
	.cta-section {
		display: grid;
		position: relative;
		grid-template-columns: subgrid;
		grid-column: full-start / full-end;
		padding: 58px 32px;
		overflow: hidden;
		border-radius: var(--radius-xl);
		background-color: var(--fill-pop-bg);
	}

	.cta-section__content {
		z-index: 1;
		position: relative;
		grid-column: narrow-start / narrow-end;
	}

	.chip-free-opensource {
		display: inline-block;
		padding: 8px 12px;
		border-radius: 100px;
		background: var(--fill-pop-fg);
		color: var(--clr-pop-40);
	}

	.cta-section__header {
		max-width: 600px;
		margin-top: 16px;
		color: var(--fill-pop-fg);
		font-size: 82px;
		line-height: 1;
		font-family: var(--font-accent);
	}

	.cta-section__description {
		max-width: 600px;
		margin-top: 16px;
		color: var(--fill-pop-fg);
		opacity: 0.8;
	}

	.grainy-bg {
		background-image: url("/images/grainy-gradient-dark.png");
		opacity: 0.14;
	}

	.grainy-1 {
		top: -30%;
		left: -20%;
	}
	.grainy-2 {
		right: -30%;
		bottom: -120%;
	}

	@media (--mobile-viewport) {
		.cta-section {
			padding: 24px;
		}
		.cta-section__header {
			font-size: 48px;
			text-wrap: balance;
		}
	}
</style>
