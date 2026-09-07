<script lang="ts">
	import PrStatusBadge from "$components/forge/PrStatusBadge.svelte";
	import Drawer from "$components/shared/Drawer.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import { PR_SERVICE } from "$lib/forge/prService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Avatar, Link, Markdown, TestId } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		prNumber: number;
		onerror?: (error: unknown) => void;
	};
	const { projectId, prNumber, onerror }: Props = $props();

	const prService = inject(PR_SERVICE);
	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeInfo = $derived(forgeInfoQuery.response);
	const abbr = $derived(forgeInfo?.unit.abbr ?? "PR");
	const symbol = $derived(forgeInfo?.unit.symbol ?? "#");
	const prQuery = $derived(prService.get(projectId, prNumber, { forceRefetch: true }));
</script>

<ReduxResult result={prQuery.result} {projectId} {onerror}>
	{#snippet children(pr)}
		<Drawer testId={TestId.PRBranchDrawer} rounded>
			{#snippet header()}
				<h3 class="text-14 text-semibold truncate">
					<span class="clr-text-2">{abbr} {symbol}{pr.number}:</span>
					<span> {pr.title}</span>
				</h3>
			{/snippet}

			<div class="pr-content">
				<div class="pr-request-data">
					<Avatar
						size="medium"
						srcUrl={pr.author?.gravatarUrl || ""}
						username={pr.author?.name || $i18nMessages.t("desktop:PrDetailsDrawer.inlineb33211f7f")}
					/>
					<div class="pr-request-data__wrapper">
						<p class="pr-request-data__sentence text-13">
							{#snippet i18nSlot1(content: import("svelte").Snippet)}<span
									class="text-bold clr-text-1">{@render content()}</span
								>{/snippet}
							{#snippet i18nSlot2(content: import("svelte").Snippet)}<span
									class="code-string text-semibold">{@render content()}</span
								>{/snippet}
							{#snippet i18nSlot3(content: import("svelte").Snippet)}<span
									class="code-string text-semibold">{@render content()}</span
								>{/snippet}
							<I18nRichMessage
								value={{
									key: "desktop:PrDetailsDrawer.valueWantsToMergeIntoValueFromValue",
									values: {
										value: String(pr.author?.name),
										targetBranch: String(pr.targetBranch),
										sourceBranch: String(pr.sourceBranch),
									},
								}}
								components={{ slot1: i18nSlot1, slot2: i18nSlot2, slot3: i18nSlot3 }}
							/>
						</p>

						<div class="pr-request-data__details text-12">
							<PrStatusBadge {pr} />
							{#snippet i18nSlot4(content: import("svelte").Snippet)}<span
									class="pr-request-data__divider">{@render content()}</span
								>{/snippet}
							{#snippet i18nSlot5(content: import("svelte").Snippet)}<span>{@render content()}</span
								>{/snippet}
							{#snippet i18nSlot6(content: import("svelte").Snippet)}<span
									class="pr-request-data__divider">{@render content()}</span
								>{/snippet}
							<I18nRichMessage
								value={{ key: "desktop:PrDetailsDrawer.noRemote" }}
								components={{ slot4: i18nSlot4, slot5: i18nSlot5, slot6: i18nSlot6 }}
							/>
							<Link href={pr.htmlUrl}
								>{$i18nMessages.t("desktop:PrDetailsDrawer.openInBrowser")}</Link
							>
						</div>
					</div>
				</div>

				{#if pr.body}
					<div class="pr-body text-13 text-body">
						<Markdown content={pr.body} />
					</div>
				{/if}
			</div>
		</Drawer>
	{/snippet}
</ReduxResult>

<style lang="postcss">
	.pr-content {
		display: flex;
		flex-direction: column;
	}

	.pr-request-data {
		display: flex;
		flex-direction: row;
		width: 100%;
		padding: 16px;
		gap: 10px;
	}

	.pr-request-data__wrapper {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 10px;
	}

	.pr-request-data__sentence {
		color: var(--text-2);
		line-height: 140%;
	}

	.pr-request-data__details {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		color: var(--text-2);
	}

	.pr-request-data__divider {
		color: var(--text-3);
	}

	.code-string {
		color: var(--text-1);
	}

	.pr-body {
		padding: 16px;
		border-top: 1px solid var(--border-2);
	}
</style>
