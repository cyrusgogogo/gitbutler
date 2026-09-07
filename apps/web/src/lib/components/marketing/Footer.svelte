<script lang="ts">
	import ThemeSwitcher from "$lib/components/marketing/ThemeSwitcher.svelte";
	import * as jsonLinks from "$lib/data/links.json";
	import osIcons from "$lib/data/os-icons.json";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	interface Props {
		showDownloadLinks?: boolean;
	}

	const { showDownloadLinks = true }: Props = $props();
</script>

<footer class="footer">
	<div class="banner" class:no-downloads={!showDownloadLinks}>
		{#if showDownloadLinks}
			<div class="banner-content-downloads">
				<div class="stack-v">
					<h2 class="banner-title">
						{#snippet i18nSlot1(content: import("svelte").Snippet)}<i>{@render content()}</i
							>{/snippet}
						<I18nRichMessage
							value={{ key: "web:Footer.downloadTheApp" }}
							components={{ slot1: i18nSlot1 }}
						/>
					</h2>

					<div class="download-links">
						<div class="download-category">
							<svg
								class="download-icon"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d={osIcons.macos} fill="currentColor" />
							</svg>

							<a href={jsonLinks.downloads.appleSilicon.url} class="download-link"
								>{$i18nMessages.t("web:Footer.macOSValue", {
									label: String(jsonLinks.downloads.appleSilicon.label),
								})}</a
							>
						</div>

						<div class="download-category">
							<svg
								class="download-icon"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d={osIcons.linux} fill="currentColor" />
							</svg>
							<div class="flex gap-12">
								{#snippet i18nSlot3(content: import("svelte").Snippet)}<a
										href={jsonLinks.downloads.linuxDeb.url}
										class="download-link">{@render content()}</a
									>{/snippet}
								{#snippet i18nSlot4(content: import("svelte").Snippet)}<a
										href={jsonLinks.downloads.linuxRpm.url}
										class="download-link">{@render content()}</a
									>{/snippet}
								<I18nRichMessage
									value={{ key: "web:Footer.dEBRPM" }}
									components={{ slot3: i18nSlot3, slot4: i18nSlot4 }}
								/>
							</div>
						</div>

						<div class="download-category">
							<svg
								class="download-icon"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d={osIcons.windows} fill="currentColor" />
							</svg>

							<a href={jsonLinks.downloads.windowsMsi.url} class="download-link">
								{jsonLinks.downloads.windowsMsi.label}
							</a>
						</div>
					</div>
				</div>

				<div class="stack-v gap-8">
					<p class="banner-nightly-text">
						{#snippet i18nSlot5(content: import("svelte").Snippet)}<span class="op-50"
								>{@render content()}</span
							>{/snippet}
						{#snippet i18nSlot6(content: import("svelte").Snippet)}<a
								href="/downloads"
								class="nightly-link">{@render content()}</a
							>{/snippet}
						<I18nRichMessage
							value={{ key: "web:Footer.notYourSystemSeeMoreDownloadOptions" }}
							components={{ slot5: i18nSlot5, slot6: i18nSlot6 }}
						/>
					</p>

					<p class="banner-nightly-text">
						{#snippet i18nSlot7(content: import("svelte").Snippet)}<span class="op-50"
								>{@render content()}</span
							>{/snippet}
						{#snippet i18nSlot8(content: import("svelte").Snippet)}<a
								href="/nightly"
								class="nightly-link">{@render content()}</a
							>{/snippet}
						<I18nRichMessage
							value={{ key: "web:Footer.experienceGitButlerSNewestFeaturesBeforeAnyoneElse" }}
							components={{ slot7: i18nSlot7, slot8: i18nSlot8 }}
						/>
					</p>
				</div>
			</div>
		{:else}
			<div class="banner-content-downloads">
				<h2 class="banner-title">
					{#snippet i18nSlot9(content: import("svelte").Snippet)}<i>{@render content()}</i
						>{/snippet}
					{#snippet i18nSlot10()}<br />{/snippet}
					{#snippet i18nSlot11(content: import("svelte").Snippet)}<i>{@render content()}</i
						>{/snippet}
					<I18nRichMessage
						value={{ key: "web:Footer.versionControlWithAttitude" }}
						components={{ slot9: i18nSlot9, slot10: i18nSlot10, slot11: i18nSlot11 }}
					/>
				</h2>
			</div>
		{/if}

		<img class="banner-image" src="/images/pc-skater.svg" alt="" />

		<div class="banner-bg">
			<div class="banner-bg-grainy grainy-1"></div>
			<div class="banner-bg-grainy grainy-2"></div>
		</div>
	</div>

	<div class="links">
		<ul class="links-list">
			{#each Object.values(jsonLinks.social) as social}
				<li class="text-14 link">
					<a href={social.url}>
						<span>{social.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<hr class="links-divider" />

		<ul class="links-list">
			{#each Object.values(jsonLinks.resources) as resource}
				<li class="text-16 link">
					<a href={resource.url}>
						<span>{$i18nMessages.text(resource.label)}</span>
					</a>
				</li>
			{/each}
		</ul>

		<div class="stack-v gap-20">
			<div class="meta-links">
				{#snippet i18nSlot12(content: import("svelte").Snippet)}<span class="meta-links__copyright"
						>{@render content()}</span
					>{/snippet}
				{#snippet i18nSlot13(content: import("svelte").Snippet)}<span class="meta-links__legal"
						>{@render content()}</span
					>{/snippet}
				{#snippet i18nSlot14(content: import("svelte").Snippet)}<a
						href={jsonLinks.legal.privacyPolicy.url}
						target="_blank">{@render content()}</a
					>{/snippet}
				{#snippet i18nSlot15(content: import("svelte").Snippet)}<span>{@render content()}</span
					>{/snippet}
				{#snippet i18nSlot16(content: import("svelte").Snippet)}<a
						href={jsonLinks.legal.termsOfService.url}
						target="_blank">{@render content()}</a
					>{/snippet}
				<I18nRichMessage
					value={{
						key: "web:Footer.valueGitButlerAllRightsReservedValueValue",
						values: {
							value: String(new Date().getFullYear()),
							label: $i18nMessages.text(jsonLinks.legal.privacyPolicy.label),
							label2: $i18nMessages.text(jsonLinks.legal.termsOfService.label),
						},
					}}
					components={{
						slot12: i18nSlot12,
						slot13: i18nSlot13,
						slot14: i18nSlot14,
						slot15: i18nSlot15,
						slot16: i18nSlot16,
					}}
				/>
			</div>

			<ThemeSwitcher />
		</div>
	</div>
</footer>

<style lang="postcss">
	.footer {
		display: flex;
		grid-column: full-start / full-end;
		margin-bottom: 80px;
		gap: 60px;
	}

	.banner {
		display: flex;
		position: relative;
		flex: 3.3;
		padding: 36px 48px;
	}

	.banner-bg {
		z-index: -1;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: var(--radius-xl);
		background-color: color-mix(in srgb, var(--fill-pop-bg) 40%, var(--chip-pop-bg));
	}

	.banner-bg-grainy {
		position: absolute;
		width: 900px;
		height: 800px;
		transform: rotate(26deg);
		background-image: url("/images/grainy-gradient-light.png");
		background-size: 100%;
		background-repeat: no-repeat;
		opacity: 0.4;
		pointer-events: none;
	}

	.grainy-1 {
		bottom: -130%;
		left: -50%;
	}

	.grainy-2 {
		right: -40%;
		bottom: -70%;
	}

	:global(.dark) .banner-bg-grainy {
		opacity: 0.2;
	}

	.banner-content-downloads {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
	}

	.banner-title {
		margin-bottom: 38px;
		font-size: 60px;
		line-height: 1.1;
		font-family: var(--font-accent);
	}

	.download-links {
		column-gap: 16px;
		max-width: 400px;
	}

	.download-category {
		display: flex;
		align-items: flex-start;
		margin-bottom: 16px;
		gap: 24px;
		break-inside: avoid;
	}

	.download-icon {
		width: 28px;
		height: 28px;
		transform: translateY(-4px);
	}

	.download-link {
		color: var(--text-1);
		font-size: 16px;
		line-height: 120%;
		text-decoration: underline;
		text-underline-offset: 2px;

		&:hover {
			text-decoration: underline wavy;
			text-decoration-color: var(--fill-pop-bg);
		}
	}

	.banner-image {
		width: 320px;
		margin-top: -40px;
		margin-right: -40px;
		transform: translateX(20px) translateY(50px);
	}

	.banner-nightly-text {
		display: inline;
		/* margin-bottom: 40px; */
		font-size: 14px;
		line-height: 1.6;
	}

	.nightly-link {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;

		&:hover {
			color: var(--text-1);
			text-decoration: underline wavy;
		}
	}

	/* links section */
	.links {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-self: flex-end;
		gap: 34px;
	}

	.links-divider {
		margin: 0;
		border: none;
		border-top: 1px solid var(--border-2);
	}

	.links-list {
		display: flex;
		column-gap: 16px;
		row-gap: 12px;
		flex-wrap: wrap;
	}

	.link {
		a {
			display: inline-flex;
			align-items: center;

			&:hover {
				color: var(--text-1);
				text-decoration: underline wavy;
				text-decoration-color: var(--fill-pop-bg);
			}
		}
	}

	.meta-links {
		display: flex;
		flex-direction: column;
		gap: 10px;
		color: var(--text-2);
		font-size: 12px;
	}

	.meta-links__legal {
		display: flex;
		gap: 8px;

		a {
			color: inherit;
			text-decoration: underline;

			&:hover {
				color: var(--text-1);
				text-decoration: none;
			}
		}
	}

	@media (--desktop-small-viewport) {
		.banner {
			padding: 24px;

			&.no-downloads {
				display: none;
			}
		}

		.banner-title {
			margin-bottom: 24px;
			font-size: 42px;
		}

		.banner-image {
			display: none;
		}

		.download-links {
			display: flex;
			column-gap: 40px;
			flex-wrap: wrap;
			max-width: none;
			columns: unset;
		}

		.links {
			align-self: start;
			justify-content: space-between;
			gap: 16px;
		}

		.links-divider {
			display: none;
		}

		.links-list {
			padding-bottom: 0;
			gap: 8px 12px;
			border-bottom: none !important;
		}

		.meta-links {
			align-self: center;
			width: 100%;
			margin-top: 20px;
			gap: 4px;
		}

		.grainy-1 {
			bottom: -200%;
			left: -100%;
		}

		.grainy-2 {
			right: -80%;
			bottom: -120%;
		}
	}

	@media (--tablet-viewport) {
		.footer {
			flex-direction: column;
			margin-bottom: 40px;
			gap: 40px;
		}
	}

	@media (max-width: 500px) {
		.download-links {
			column-gap: 0;
			flex-direction: column;
		}

		.grainy-1 {
			bottom: -160%;
			left: -180%;
		}
		.grainy-2 {
			right: -170%;
			bottom: -90%;
		}
	}
</style>
