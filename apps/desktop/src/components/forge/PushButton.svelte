<script lang="ts">
	import GerritPushModal from "$components/forge/GerritPushModal.svelte";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { URL_SERVICE } from "$lib/backend/url";
	import { commitCommittedAtDate } from "$lib/branches/v3";
	import { splitMessage } from "$lib/commits/commitMessage";
	import { projectRunCommitHooks } from "$lib/config/config";
	import { commitUrl, FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { branchHasConflicts, branchHasUnpushedCommits } from "$lib/stacks/stack";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { UI_STATE } from "$lib/state/uiState.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { persisted } from "@gitbutler/shared/persisted";
	import {
		Button,
		Checkbox,
		Modal,
		TestId,
		SimpleCommitRow,
		ScrollableContainer,
		chipToasts,
	} from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import type { GerritPushFlag } from "$lib/stacks/stack";
	import type { Segment } from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		stackId?: string;
		branchName: string;
		segment: Segment;
		withForce: boolean;
		multipleBranches: boolean;
		isLastBranchInStack?: boolean;
		isFirstBranchInStack?: boolean;
	};

	const {
		projectId,
		branchName,
		stackId,
		segment,
		withForce,
		multipleBranches,
		isFirstBranchInStack,
		isLastBranchInStack,
	}: Props = $props();

	const stackService = inject(STACK_SERVICE);
	const projectsService = inject(PROJECTS_SERVICE);
	const uiState = inject(UI_STATE);
	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeInfo = $derived(forgeInfoQuery.response);
	const urlService = inject(URL_SERVICE);
	const clipboardService = inject(CLIPBOARD_SERVICE);

	// Get current project to check gerrit_mode
	const projectResponse = $derived(projectsService.getProject(projectId));
	const isGerritMode = $derived(projectResponse.response?.gerrit_mode ?? false);
	const runHooks = $derived(projectRunCommitHooks(projectId));

	// Component is read-only when stackId is undefined
	const isReadOnly = $derived(!stackId);

	const [pushStack, pushQuery] = stackService.pushStack;

	const hasThingsToPush = $derived(branchHasUnpushedCommits(segment));
	const hasConflicts = $derived(branchHasConflicts(segment));
	const upstreamCommits = $derived(segment.commitsOnRemote);
	const remoteTrackingBranch = $derived(
		segment.remoteTrackingRefName
			? new TextDecoder().decode(new Uint8Array(segment.remoteTrackingRefName.fullNameBytes))
			: null,
	);
	const buttonDisabled = $derived(isReadOnly || !hasThingsToPush || hasConflicts);

	function handleClick(args: {
		withForce: boolean;
		skipForcePushProtection: boolean;
		gerritFlags: GerritPushFlag[];
	}) {
		if (isGerritMode) {
			gerritModal?.show();
			return;
		}

		if (multipleBranches && !isLastBranchInStack && !$doNotShowPushBelowWarning) {
			confirmationModal?.show();
			return;
		}

		push(args);
	}

	async function push(args: {
		withForce: boolean;
		skipForcePushProtection: boolean;
		gerritFlags: GerritPushFlag[];
	}) {
		if (!stackId) return;

		const { withForce, skipForcePushProtection, gerritFlags } = args;
		try {
			const pushResult = await pushStack({
				projectId,
				stackId,
				withForce,
				skipForcePushProtection,
				branch: branchName,
				runHooks: $runHooks,
				pushOpts: gerritFlags,
			});

			const upstreamBranchNames = pushResult.branchToRemote.map(([, , name]) => name);
			if (upstreamBranchNames.length === 0) return;
			uiState.project(projectId).branchesToPoll.add(...upstreamBranchNames);

			// Show success notification
			chipToasts.success(
				i18nMessage(
					multipleBranches && !isLastBranchInStack
						? "desktop:push.succeededWithLower"
						: "desktop:push.succeeded",
					{ branch: branchName },
				),
			);
		} catch (error: any) {
			if (error?.code === "GitForcePushProtection") {
				forcePushProtectionModal?.show();
				return;
			}
			throw error;
		}
	}

	const loading = $derived(pushQuery.current.isLoading);

	function getButtonTooltip(
		hasThingsToPush: boolean,
		hasConflicts: boolean,
		withForce: boolean,
		remoteTrackingBranch: string | null,
	): string | undefined {
		if (isReadOnly) {
			return $i18nMessages.t("desktop:PushButton.detail893cd37c4");
		}

		if (!hasThingsToPush) {
			return $i18nMessages.t("desktop:PushButton.detail6579c0ce8");
		}

		if (hasConflicts) {
			return $i18nMessages.t("desktop:PushButton.detail184fa5f6f");
		}

		if (multipleBranches && !isLastBranchInStack) {
			return $i18nMessages.t("desktop:PushButton.detail5304846e6");
		}

		if (withForce) {
			return remoteTrackingBranch
				? $i18nMessages.t("desktop:PushButton.detailc623d45d2")
				: $i18nMessages.t("desktop:PushButton.detailfd671ae66", {
						value1: String(remoteTrackingBranch),
					});
		}

		return remoteTrackingBranch
			? $i18nMessages.t("desktop:push.toRemote", { remote: remoteTrackingBranch })
			: $i18nMessages.t("desktop:push.thisBranch");
	}

	const doNotShowPushBelowWarning = persisted<boolean>(false, "doNotShowPushBelowWarning");
	let confirmationModal = $state<ReturnType<typeof Modal>>();
	let forcePushProtectionModal = $state<ReturnType<typeof Modal>>();
	let gerritModal = $state<GerritPushModal>();
	let pendingGerritFlags = $state<GerritPushFlag[]>([]);
</script>

<Button
	testId={TestId.StackPushButton}
	kind={isFirstBranchInStack ? "solid" : "outline"}
	size="tag"
	style="gray"
	{loading}
	disabled={buttonDisabled}
	tooltip={getButtonTooltip(hasThingsToPush, hasConflicts, withForce, remoteTrackingBranch)}
	onclick={() => handleClick({ withForce, skipForcePushProtection: false, gerritFlags: [] })}
	icon={multipleBranches && !isLastBranchInStack ? "push-all" : "push"}
>
	{isGerritMode
		? $i18nMessages.t("desktop:PushButton.push")
		: withForce
			? $i18nMessages.t("desktop:PushButton.forcePush")
			: $i18nMessages.t("desktop:PushButton.push")}
</Button>

<Modal
	title={$i18nMessages.t("desktop:PushButton.pushWithDependencies")}
	width="small"
	bind:this={confirmationModal}
	onSubmit={async (close) => {
		close();
		push({
			withForce,
			skipForcePushProtection: false,
			gerritFlags: pendingGerritFlags,
		});
		pendingGerritFlags = [];
	}}
>
	<p>
		{#snippet i18nSlot1(content: import("svelte").Snippet)}<span class="text-bold"
				>{@render content()}</span
			>{/snippet}
		<I18nRichMessage
			value={{
				key: "desktop:PushButton.youReAboutToPushValueToMaintain",
				values: { branchName: String(branchName) },
			}}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>

	{#snippet controls(close)}
		<div class="modal-footer">
			<div class="flex flex-1">
				<label for="dont-show-again" class="modal-footer__checkbox">
					<Checkbox name="dont-show-again" small bind:checked={$doNotShowPushBelowWarning} />
					<span class="text-12">{$i18nMessages.t("desktop:PushButton.donTShowAgain")}</span>
				</label>
			</div>
			<Button
				kind="outline"
				onclick={() => {
					$doNotShowPushBelowWarning = false;
					close();
				}}
			>
				{$i18nMessages.t("desktop:PushButton.cancel")}
			</Button>
			<Button testId={TestId.StackConfirmPushModalButton} style="pop" type="submit" width={90}>
				{$i18nMessages.t("desktop:PushButton.push")}
			</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	title={$i18nMessages.t("desktop:PushButton.protectedForcePush")}
	width={480}
	type="warning"
	bind:this={forcePushProtectionModal}
	onSubmit={async (close) => {
		close();
		push({
			withForce,
			skipForcePushProtection: true,
			gerritFlags: pendingGerritFlags,
		});
		pendingGerritFlags = [];
	}}
>
	<p class="description">
		{#snippet i18nSlot3(content: import("svelte").Snippet)}<span class="text-bold text-nowrap"
				>{@render content()}</span
			>{/snippet}
		{#snippet i18nSlot4(content: import("svelte").Snippet)}<span class="text-bold"
				>{@render content()}</span
			>{/snippet}
		<I18nRichMessage
			value={{ key: "desktop:push.forceBlocked", values: { count: upstreamCommits?.length ?? 0 } }}
			components={{ slot3: i18nSlot3, slot4: i18nSlot4 }}
		/>
	</p>
	{#if upstreamCommits}
		<div class="scroll-wrap">
			<ScrollableContainer maxHeight="16.5rem">
				{#each upstreamCommits as commit}
					{@const url = forgeInfo ? commitUrl(forgeInfo, commit.id) : undefined}
					<SimpleCommitRow
						title={splitMessage(commit.message).title ?? ""}
						sha={commit.id}
						date={commitCommittedAtDate(commit)}
						author={commit.author.name}
						{url}
						onOpen={(url) => urlService.openExternalUrl(url)}
						onCopy={() =>
							clipboardService.write(commit.id, {
								message: i18nMessage("desktop:PushButton.inlinefb6ebf38a"),
							})}
					/>
				{/each}
			</ScrollableContainer>
		</div>
	{/if}

	{#snippet controls(close)}
		<div class="controls">
			<Button kind="outline" type="submit"
				>{$i18nMessages.t("desktop:PushButton.forcePushAnyway")}</Button
			>
			<Button wide style="pop" onclick={close}
				>{$i18nMessages.t("desktop:PushButton.cancel")}</Button
			>
		</div>
	{/snippet}
</Modal>

<GerritPushModal
	bind:this={gerritModal}
	{projectId}
	{stackId}
	{branchName}
	{multipleBranches}
	{isFirstBranchInStack}
	{isLastBranchInStack}
	onPush={(gerritFlags) => {
		if (multipleBranches && !isLastBranchInStack && !$doNotShowPushBelowWarning) {
			// Store all gerrit flags for later use when confirmation modal completes
			pendingGerritFlags = gerritFlags;
			confirmationModal?.show();
		} else {
			push({ withForce, skipForcePushProtection: false, gerritFlags });
		}
	}}
/>

<style>
	/* MODAL */
	.modal-footer {
		display: flex;
		width: 100%;
		gap: 6px;
	}

	/* CONTROLS */
	.controls {
		display: flex;
		width: 100%;
		gap: 6px;
	}

	.modal-footer__checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* COMMITS SCROLL CONTAINER */
	.description {
		margin: 0 0 16px;
	}
	.scroll-wrap {
		overflow: hidden;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
	}
</style>
