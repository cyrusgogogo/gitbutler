<script lang="ts">
	import PrStatusBadge from "$components/forge/PrStatusBadge.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { URL_SERVICE } from "$lib/backend/url";
	import { CHECKS_MONITOR } from "$lib/forge/checksMonitor.svelte";
	import { FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import { PR_SERVICE } from "$lib/forge/prService.svelte";
	import { REPO_SERVICE } from "$lib/forge/repoService.svelte";
	import { createPollBackoff } from "$lib/forge/shared/pollErrorBackoff.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		Button,
		ContextMenu,
		ContextMenuItem,
		ContextMenuSection,
		Icon,
		AvatarGroup,
		TestId,
	} from "@gitbutler/ui";
	import { getForgeLogo } from "@gitbutler/ui/utils/getForgeLogo";
	import type { PullRequest } from "$lib/forge/interface/types";
	import type { Snippet } from "svelte";
	const i18nMessages = useTranslations();

	type ButtonStatus = {
		disabled: boolean;
		tooltip?: string;
	};

	interface Props {
		projectId: string;
		testId?: string;
		branchName: string;
		poll?: boolean;
		prNumber: number;
		isPushed?: boolean;
		hasParent?: boolean;
		baseIsTargetBranch?: boolean;
		parentIsPushed?: boolean;
		button?: Snippet<
			[
				{
					pr: PullRequest;
					mergeStatus: ButtonStatus;
					reopenStatus: ButtonStatus;
					setDraft: (draft: boolean) => Promise<void>;
				},
			]
		>;
	}

	const {
		projectId,
		testId,
		poll,
		prNumber,
		isPushed,
		hasParent,
		baseIsTargetBranch,
		parentIsPushed,
		button,
	}: Props = $props();

	let contextMenuOpen = $state(false);
	let contextMenuTarget = $state<MouseEvent | HTMLElement>();
	let container = $state<HTMLElement>();
	let hasChecks = $state(false);

	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const prService = inject(PR_SERVICE);
	const repoService = inject(REPO_SERVICE);
	const checksMonitor = inject(CHECKS_MONITOR);
	const urlService = inject(URL_SERVICE);
	const clipboardService = inject(CLIPBOARD_SERVICE);

	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeInfo = $derived(forgeInfoQuery.response);
	const forgeName = $derived(forgeInfo?.name ?? "default");
	const repoInfoEnabled = $derived(!!forgeInfo?.capabilities.repoInfo);
	const checksEnabled = $derived(!!forgeInfo?.capabilities.checks);

	// Backs polling off while the PR query is failing (offline, or the shared
	// GitHub token is rate-limited) and restores the schedule on recovery.
	let elapsedMs = $state<number>(0);
	let isClosed = $state(false);
	const prBackoff = createPollBackoff({
		getResult: () => prQuery.result,
		getElapsedMs: () => elapsedMs,
		getShouldStop: () => isClosed,
	});
	const prPollingInterval = $derived(poll ? prBackoff.pollingInterval : undefined);

	const prQuery = $derived(
		prService.get(projectId, prNumber, {
			forceRefetch: true,
			subscriptionOptions: { pollingInterval: prPollingInterval },
		}),
	);
	const pr = $derived(prQuery.response);
	// The merge-status endpoint hits the forge fresh on every call and can fail
	// while the PR query is fine, so it needs its own error backoff — sharing the
	// PR query's interval would keep retrying on the fast schedule.
	const mergeStatusBackoff = createPollBackoff({
		getResult: () => mergeStatusQuery.result,
		getElapsedMs: () => elapsedMs,
		getShouldStop: () => isClosed,
	});
	const mergeStatusPollingInterval = $derived(
		poll ? mergeStatusBackoff.pollingInterval : undefined,
	);
	// GitHub computes `mergeable_state` lazily: the first read after a push says
	// `unknown`, so it needs re-reading or Merge stays disabled.
	const mergeStatusQuery = $derived(
		prService.getMergeStatus(projectId, prNumber, {
			subscriptionOptions: { pollingInterval: mergeStatusPollingInterval },
		}),
	);
	const prMergeStatus = $derived(mergeStatusQuery.response);

	$effect(() => {
		// Reading the whole result, not just the data, restamps on every poll so
		// the schedule widens while the PR sits untouched.
		const polled = prQuery.result?.data;
		if (!polled) return;

		isClosed = !!polled.closedAt;
		elapsedMs = Date.now() - Date.parse(polled.modifiedAt);
	});
	const repoQuery = $derived(repoInfoEnabled ? repoService.getInfo(projectId) : undefined);
	const repoInfo = $derived(repoQuery?.response);

	const name = $derived(
		$i18nMessages.t(
			forgeInfo?.unit.abbr === "MR" ? "desktop:review.mergeRequest" : "desktop:review.pullRequest",
		),
	);
	const abbr = $derived(forgeInfo?.unit.abbr ?? "PR");
	const symbol = $derived(forgeInfo?.unit.symbol ?? "#");

	let draftToggling = $state(false);

	async function handleSetDraft(draft: boolean) {
		if (draftToggling) return;
		draftToggling = true;
		try {
			await prService.setDraft(projectId, prNumber, draft);
			await prService.fetch(projectId, prNumber, { forceRefetch: true });
		} finally {
			draftToggling = false;
		}
	}

	const mergeStatus = $derived.by(() => {
		let disabled = true;
		let tooltip = undefined;
		if (isPushed && hasParent && !parentIsPushed) {
			tooltip = $i18nMessages.t("desktop:PullRequestCard.detail65de983f0");
		} else if (!baseIsTargetBranch) {
			tooltip = $i18nMessages.t("desktop:detail.fbce8584a8", { name });
		} else if (repoInfoEnabled && !repoInfo?.canMerge) {
			// Forges without a repoService (e.g. Bitbucket, Azure) rely
			// on the server-side merge button to refuse.
			tooltip = $i18nMessages.t("desktop:detail.05fe1240ee", { name });
		} else if (pr?.draft) {
			tooltip = $i18nMessages.t("desktop:detail.3410c542d7", { name });
		} else if (prMergeStatus?.mergeableState === "blocked") {
			tooltip = $i18nMessages.t("desktop:detail.32361da415", { name });
		} else if (prMergeStatus?.mergeableState === "unknown") {
			tooltip = $i18nMessages.t("desktop:detail.61d1a6e1b7", { name });
		} else if (prMergeStatus?.mergeableState === "behind") {
			tooltip = $i18nMessages.t("desktop:detail.d41668dd7b", { name });
		} else if (prMergeStatus?.mergeableState === "dirty") {
			tooltip = $i18nMessages.t("desktop:detail.5e67a60be5", { name });
		} else if (!prMergeStatus) {
			// Loading, or the status fetch failed — don't claim "not mergeable"
			// when the state simply isn't known.
			tooltip = $i18nMessages.t("desktop:detail.c0f3e46bcb", { name });
		} else if (!prMergeStatus.isMergeable) {
			tooltip = $i18nMessages.t("desktop:detail.9ece2c816e", { name });
		} else {
			disabled = false;
		}
		return { disabled, tooltip };
	});

	const reopenStatus = $derived.by(() => {
		let disabled = true;
		let tooltip = undefined;
		if (isPushed && hasParent && !parentIsPushed) {
			tooltip = $i18nMessages.t("desktop:PullRequestCard.detail65de983f0");
		} else {
			disabled = false;
		}
		return { disabled, tooltip };
	});
</script>

<ReduxResult result={prQuery?.result} projectId="dummy">
	{#snippet children(pr)}
		{#if contextMenuOpen}
			<ContextMenu
				target={contextMenuTarget}
				onclose={() => {
					contextMenuOpen = false;
				}}
			>
				<ContextMenuSection>
					<ContextMenuItem
						label={$i18nMessages.t("desktop:PullRequestCard.openInBrowser")}
						onclick={() => {
							contextMenuOpen = false;
							urlService.openExternalUrl(pr.htmlUrl);
						}}
					/>
					<ContextMenuItem
						label={$i18nMessages.t("desktop:PullRequestCard.copyLink")}
						onclick={() => {
							contextMenuOpen = false;
							clipboardService.write(pr.htmlUrl, {
								message: i18nMessage("desktop:PullRequestCard.inlinefca40ccf3", {
									value1: String(abbr),
								}),
							});
						}}
					/>
					<ContextMenuItem
						label={$i18nMessages.t("desktop:PullRequestCard.refetchStatus")}
						onclick={() => {
							contextMenuOpen = false;
							prService.fetch(projectId, pr.number, { forceRefetch: true });
							prService.fetchMergeStatus(projectId, pr.number, { forceRefetch: true });
							if (hasChecks && checksEnabled) {
								checksMonitor.fetch(projectId, pr.sourceBranch, { forceRefetch: true });
							}
						}}
					/>
					{#if !pr.closedAt && !pr.mergedAt}
						<ContextMenuItem
							label={pr.draft
								? $i18nMessages.t("desktop:PullRequestCard.inline8c2d9db10")
								: $i18nMessages.t("desktop:PullRequestCard.inlineab263713a")}
							disabled={draftToggling}
							onclick={async () => {
								contextMenuOpen = false;
								await handleSetDraft(!pr.draft);
							}}
						/>
					{/if}
				</ContextMenuSection>
				{#if hasChecks}
					<ContextMenuSection>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:PullRequestCard.openChecks")}
							onclick={() => {
								contextMenuOpen = false;
								urlService.openExternalUrl(`${pr.htmlUrl}/checks`);
							}}
						/>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:PullRequestCard.copyChecks")}
							onclick={() => {
								contextMenuOpen = false;
								clipboardService.write(`${pr.htmlUrl}/checks`, {
									message: i18nMessage("desktop:PullRequestCard.inlinef267048a5"),
								});
							}}
						/>
					</ContextMenuSection>
				{/if}
			</ContextMenu>
		{/if}

		<div
			data-testid={testId}
			bind:this={container}
			role="article"
			class="review-card pr-card"
			oncontextmenu={(e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				contextMenuTarget = e;
				contextMenuOpen = true;
			}}
		>
			<div class="pr-actions">
				<Button
					kind="outline"
					size="tag"
					icon="copy"
					tooltip={$i18nMessages.t("desktop:PullRequestCard.copyValueLink", { abbr: String(abbr) })}
					onclick={() => {
						clipboardService.write(pr.htmlUrl, {
							message: i18nMessage("desktop:PullRequestCard.inlinefca40ccf3", {
								value1: String(abbr),
							}),
						});
					}}
				/>
				<Button
					kind="outline"
					size="tag"
					icon="arrow-up-righ"
					tooltip={$i18nMessages.t("desktop:PullRequestCard.openValueInBrowser", {
						abbr: String(abbr),
					})}
					onclick={() => {
						urlService.openExternalUrl(pr.htmlUrl);
					}}
				/>
			</div>

			<div class="text-13 text-semibold pr-row">
				<Icon name={getForgeLogo(forgeName)} />
				<h4 class="text-14 text-semibold">
					{`${abbr} ${symbol}${pr.number}`}
				</h4>

				<PrStatusBadge testId={TestId.PRStatusBadge} {pr} />
			</div>
			<div class="text-12 pr-row">
				<div class="factoid">
					{#if pr.reviewers.length > 0}
						<span class="label">{$i18nMessages.t("desktop:PullRequestCard.reviewers")}</span>
						<div class="avatar-group-container">
							<AvatarGroup
								avatars={pr.reviewers.map((r) => ({
									srcUrl: r.srcUrl,
									username: r.name,
								}))}
							/>
						</div>
					{:else}
						<span class="label italic"
							>{$i18nMessages.t("desktop:PullRequestCard.noReviewers")}</span
						>
					{/if}
				</div>
				<span class="separator">•</span>
				<div class="factoid">
					<span class="label">
						<Icon name="chat" size={14} />
					</span>
					<span>{prMergeStatus?.commentsCount ?? 0}</span>
				</div>
			</div>

			{#if button}
				<div class="pr-row">
					{@render button({ pr, mergeStatus, reopenStatus, setDraft: handleSetDraft })}
				</div>
			{/if}
		</div>
	{/snippet}
</ReduxResult>

<style lang="postcss">
	.pr-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;

		&:empty {
			display: none;
		}
	}

	.factoid {
		display: flex;
		align-items: center;
		gap: 4px;

		> .label {
			display: flex;
			color: var(--text-2);

			&.italic {
				font-style: italic;
			}
		}
	}

	.separator {
		transform: translateY(-1.5px);
		color: var(--text-3);
	}

	.pr-actions {
		display: flex;
		position: absolute;
		top: 8px;
		right: 8px;
		gap: 4px;
	}
</style>
