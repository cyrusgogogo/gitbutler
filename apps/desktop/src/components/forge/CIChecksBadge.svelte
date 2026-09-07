<script lang="ts">
	import { classify } from "$lib/error/errorClassification";
	import { CHECKS_MONITOR } from "$lib/forge/checksMonitor.svelte";
	import { FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import { createPollBackoff } from "$lib/forge/shared/pollErrorBackoff.svelte";
	import { UI_STATE } from "$lib/state/uiState.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Badge, TestId, type MessageStyle, type IconName } from "@gitbutler/ui";
	import type { ComponentColorType } from "@gitbutler/ui/utils/colorTypes";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		branchName: string;
		prUpdatedAt?: string;
		mergeableState?: string;
		hasChecks?: boolean;
		isFork?: boolean;
		isMerged?: boolean;
		onrefetch?: () => void;
	};

	type StatusInfo = {
		text: string;
		reducedText: string;
		icon?: IconName;
		style?: ComponentColorType;
		messageStyle?: MessageStyle;
		tooltip?: string;
	};

	let {
		projectId,
		branchName,
		prUpdatedAt,
		mergeableState,
		isFork,
		isMerged,
		hasChecks = $bindable(),
		onrefetch,
	}: Props = $props();

	const checksMonitor = inject(CHECKS_MONITOR);
	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const uiState = inject(UI_STATE);

	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeInfo = $derived(forgeInfoQuery.response);
	const checksService = $derived(forgeInfo?.capabilities.checks ? checksMonitor : undefined);
	let elapsedMs = $state<number>(0);
	let loadedOnce = $state(false);

	const projectState = $derived(uiState.project(projectId));
	const isDone = $derived(!projectState.branchesToPoll.current.includes(branchName));

	// Do not create a checks monitor if pull request is merged or from a fork.
	// For more information about unavailability of check-runs for forked repos,
	// see GitHub docs at:
	// https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#list-check-runs-in-a-check-suite
	const enabled = $derived(!isFork && !isMerged); // Deduplication.

	// Backs polling off while the checks query is failing (offline, rate-limited,
	// repo access lost) and restores the schedule on recovery. A transient 422
	// unresolvable-ref is not an error here — the backend maps it to an empty
	// list — so it does not trigger the backoff.
	const backoff = createPollBackoff({
		getResult: () => checksQuery?.result,
		getElapsedMs: () => elapsedMs,
		getShouldStop: () => isDone,
	});
	const pollingInterval = $derived(backoff.pollingInterval);

	const checksQuery = $derived(
		enabled
			? checksService?.get(projectId, branchName, { subscriptionOptions: { pollingInterval } })
			: undefined,
	);

	const loading = $derived(checksQuery?.result.isLoading);

	const checksTagInfo: StatusInfo = $derived.by(() => {
		const checks = checksQuery?.response;
		if (isFork) {
			return {
				style: "gray",
				icon: undefined,
				text: $i18nMessages.t("desktop:CIChecksBadge.detailcf84db1c5"),
				reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail0148123ea"),
				tooltip: $i18nMessages.t("desktop:CIChecksBadge.checksForForkedReposOnlyAvailableOnThe"),
			};
		}

		if (checksQuery?.result.error) {
			// A terminal error (PAT missing the Checks permission, org OAuth
			// block, no forge credentials) carries actionable guidance from
			// the backend — show that instead of a generic retry hint.
			const classified = classify(checksQuery.result.error);
			return {
				style: "danger",
				icon: "warning",
				text: $i18nMessages.t("desktop:CIChecksBadge.detailade31486d"),
				reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail7f2f6a15c"),
				tooltip: classified.terminal
					? classified.message
					: $i18nMessages.t("desktop:CIChecksBadge.failedToLoadChecksClickToRetry"),
			};
		}

		if (checks) {
			// When checks pass but the PR is blocked, it's typically because
			// review approval is still required — not a CI issue.
			if (checks.completed && checks.success && mergeableState === "blocked") {
				return {
					style: "warning",
					icon: "eye",
					text: $i18nMessages.t("desktop:CIChecksBadge.detail33a506cf6"),
					reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail33a506cf6"),
					tooltip: $i18nMessages.t("desktop:CIChecksBadge.checksPassedButThePRStillNeedsApproval"),
				};
			}

			if (checks.completed && checks.actionRequired) {
				const checksList = checks.actionRequiredChecks.join(", ");
				return {
					style: "warning",
					icon: "warning",
					text: $i18nMessages.t("desktop:CIChecksBadge.detaila5f995a22"),
					reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail97c89a4d6"),
					tooltip: checksList
						? $i18nMessages.t("desktop:CIChecksBadge.detail1dd292b75", {
								value1: String(checksList),
							})
						: $i18nMessages.t("desktop:CIChecksBadge.actionRequired"),
				};
			}

			// Merge conflicts can prevent checks from running at all.
			if (mergeableState === "dirty") {
				return {
					style: "danger",
					icon: "warning",
					text: $i18nMessages.t("desktop:CIChecksBadge.detail608efa279"),
					reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail1e6b4f9a0"),
					tooltip: $i18nMessages.t("desktop:CIChecksBadge.thePRHasMergeConflictsThatNeedTo"),
				};
			}

			const style = checks.completed ? (checks.success ? "safe" : "danger") : "warning";
			// Keep the terminal icon stable during background re-fetches
			const icon = checks.completed ? (checks.success ? "tick" : "danger") : "spinner";
			const text = checks.completed
				? checks.success
					? $i18nMessages.t("desktop:CIChecksBadge.detail30970547e")
					: $i18nMessages.t("desktop:CIChecksBadge.detail69aba2413")
				: $i18nMessages.t("desktop:CIChecksBadge.detail1d2b5b209");

			const tooltip =
				checks.completed && !checks.success
					? $i18nMessages.t("desktop:CIChecksBadge.detaild599e1627", {
							value1: String(checks.failedChecks.join(", ")),
						})
					: undefined;

			const reducedText = checks.completed
				? checks.success
					? $i18nMessages.t("desktop:CIChecksBadge.detail271d60f48")
					: $i18nMessages.t("desktop:CIChecksBadge.detail09fef5d8d")
				: $i18nMessages.t("desktop:CIChecksBadge.detail73989d9c5");
			return { style, icon, text, reducedText, tooltip };
		}
		if (loading) {
			return {
				style: "gray",
				icon: "spinner",
				text: $i18nMessages.t("desktop:CIChecksBadge.detailf26a8da06"),
				reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail5098dd199"),
				tooltip: $i18nMessages.t("desktop:CIChecksBadge.waitingForChecksToStart"),
			};
		}

		return {
			style: "gray",
			icon: undefined,
			text: $i18nMessages.t("desktop:CIChecksBadge.detaild0f315261"),
			reducedText: $i18nMessages.t("desktop:CIChecksBadge.detail0148123ea"),
			tooltip: $i18nMessages.t("desktop:CIChecksBadge.noCIChecksAreConfigured"),
		};
	});

	// Track previous state to detect transitions.
	// This should **not** be a derived, since we want to track the previous state, not the current one.
	let prevIsDone = $state(false);
	let prevChecksStartedAt = $state<string>();
	let prevPrUpdatedAt = $state<string>();

	// After a PR update (e.g. push), GitHub may still return old completed checks
	// before creating the new check runs. We prevent polling from stopping for a
	// grace period after prUpdatedAt changes, to give GitHub time to catch up.
	const STALE_GRACE_PERIOD_MS = 60_000;
	let prUpdatedAtChangedTime = $state<number>();

	// Checks have reached a terminal state or there are no checks to monitor.
	// Note: shouldStop is computed in the $effect below since the grace period
	// depends on wall-clock time (Date.now()) which isn't reactive.
	let shouldStop = $state(false);

	$effect(() => {
		// If polling was previously done but now should restart (e.g., after a force push)
		if (prevIsDone && !isDone) {
			loadedOnce = false;
			elapsedMs = 0;
			prevChecksStartedAt = undefined;
		}

		const result = checksQuery?.result;
		const checks = result?.data;

		// Mark as loaded once we start loading again
		if (loading) {
			loadedOnce = true;
		}

		// Compute shouldStop fresh each time the effect runs, since the grace
		// period depends on wall-clock time.
		const withinGracePeriod =
			prUpdatedAtChangedTime !== undefined &&
			Date.now() - prUpdatedAtChangedTime < STALE_GRACE_PERIOD_MS;
		const checksCompleted = checksQuery?.response?.completed || checksQuery?.response === null;
		shouldStop = !withinGracePeriod && checksCompleted;

		if (!isDone && loadedOnce && !loading && shouldStop) {
			projectState.branchesToPoll.remove(branchName);
		}

		// Reset polling frequency when the PR is updated (e.g. after a push).
		if (prUpdatedAt && prUpdatedAt !== prevPrUpdatedAt) {
			const parsed = Date.parse(prUpdatedAt);
			if (!Number.isNaN(parsed)) {
				elapsedMs = Date.now() - parsed;
				prUpdatedAtChangedTime = Date.now();
			}
			prevPrUpdatedAt = prUpdatedAt;
		}

		// Update elapsed time and hasChecks if checks have started
		if (checks?.startedAt && checks.startedAt !== prevChecksStartedAt) {
			const parsed = Date.parse(checks.startedAt);
			if (!Number.isNaN(parsed)) {
				elapsedMs = Date.now() - parsed;
			}
			hasChecks = true;
			prevChecksStartedAt = checks.startedAt;
		}

		// Store previous state for next effect run
		prevIsDone = isDone;
	});
</script>

<Badge
	testId={TestId.PRChecksBadge}
	size="icon"
	icon={checksTagInfo.icon}
	style={checksTagInfo.style}
	kind={checksTagInfo.icon === "tick" ? "solid" : "soft"}
	tooltip={checksTagInfo.tooltip}
	reversedDirection
	onclick={(e) => {
		e.stopPropagation();
		if (!enabled) return;
		// Re-add to polling list so that if new checks are discovered, polling resumes.
		if (isDone) {
			projectState.branchesToPoll.add(branchName);
			loadedOnce = false;
			elapsedMs = 0;
		}
		checksQuery?.result.refetch();
		onrefetch?.();
	}}
>
	<span data-pr-text={checksTagInfo.reducedText} class="truncate">
		{checksTagInfo.reducedText}
	</span>
</Badge>
