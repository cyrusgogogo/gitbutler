<script lang="ts" module>
	import type { CommitStatusType } from "$lib/commits/commit";
	interface BaseContextData {
		commitStatus: CommitStatusType;
		commitId: string;
		commitMessage: string;
		commitUrl?: string;
	}

	interface LocalCommitContextData extends BaseContextData {
		commitStatus: "LocalOnly" | "LocalAndRemote";
		stackId?: string;
		hasConflicts?: boolean;
		onUncommitClick: (event: MouseEvent) => void;
		onEditMessageClick: (event: MouseEvent) => void;
		/** When set, indicates multiple commits are selected. */
		multiSelect?: {
			commitIds: string[];
			onSquashSelected: () => void;
			onUncommitSelected: () => void;
		};
	}

	interface RemoteCommitContextData extends BaseContextData {
		commitStatus: "Remote";
		stackId?: string;
	}

	interface IntegratedCommitContextData extends BaseContextData {
		commitStatus: "Integrated";
		stackId?: string;
	}

	interface BaseCommitContextData extends BaseContextData {
		commitStatus: "Base";
	}

	export type CommitContextData =
		| LocalCommitContextData
		| RemoteCommitContextData
		| IntegratedCommitContextData
		| BaseCommitContextData;

	export type CommitMenuContext = {
		position: { coords?: { x: number; y: number }; element?: HTMLElement };
		data: CommitContextData;
	};

	// Commits with an AI resolution in flight. Module-scoped because the menu
	// instance (and its mutation state) is destroyed when the menu closes,
	// while the resolution keeps running.
	const resolvingCommits = new Set<string>();
</script>

<script lang="ts">
	import { AI_SERVICE } from "$lib/ai/service";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { URL_SERVICE } from "$lib/backend/url";
	import { projectAiGenEnabled } from "$lib/config/config";
	import { rewrapCommitMessage } from "$lib/config/uiFeatureFlags";
	import { editPatch } from "$lib/mode/editPatchUtils";
	import { MODE_SERVICE } from "$lib/mode/modeService";
	import { dismissToast, showToast } from "$lib/notifications/toasts";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject, injectOptional } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		ContextMenuItem,
		ContextMenuItemSubmenu,
		ContextMenuSection,
		KebabButton,
		TestId,
	} from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	type Props = {
		showOnHover?: boolean;
		projectId: string;
		openId?: string;
		rightClickTrigger?: HTMLElement;
		contextData: CommitContextData | undefined;
	};

	let {
		showOnHover,
		projectId,
		openId = $bindable(),
		rightClickTrigger,
		contextData,
	}: Props = $props();

	const urlService = inject(URL_SERVICE);
	const stackService = inject(STACK_SERVICE);
	const clipboardService = inject(CLIPBOARD_SERVICE);
	const modeService = injectOptional(MODE_SERVICE, undefined);
	const aiService = inject(AI_SERVICE);
	const [insertBlankCommitInBranch, commitInsertion] = stackService.insertBlankCommit.useMutation();
	const [createBranch, branchCreation] = stackService.branchCreate;
	const [resolveConflictsAi, aiResolution] = stackService.resolveCommitConflictsAi;

	const aiGenEnabled = $derived(projectAiGenEnabled(projectId));
	const commitHasConflicts = $derived(
		contextData !== undefined && "hasConflicts" in contextData && !!contextData.hasConflicts,
	);
	let aiConfigurationValid = $state(false);

	// Validating the AI configuration costs several backend calls, so only do
	// it for the rare rows that can actually offer the AI-resolve action.
	$effect(() => {
		if (!commitHasConflicts || !$aiGenEnabled) return;
		let stale = false;
		aiService.validateConfiguration().then(
			(valid) => {
				if (!stale) aiConfigurationValid = valid;
			},
			() => {
				if (!stale) aiConfigurationValid = false;
			},
		);
		return () => {
			stale = true;
		};
	});

	// Component is read-only when stackId is undefined
	const isReadOnly = $derived(
		contextData?.commitStatus === "LocalAndRemote" || contextData?.commitStatus === "LocalOnly"
			? !contextData.stackId
			: false,
	);

	async function insertBlankCommit(commitId: string, location: "above" | "below" = "below") {
		await insertBlankCommitInBranch({
			projectId,
			relativeTo: { type: "commit", subject: commitId },
			side: location,
			dryRun: false,
		});
	}

	async function handleCreateNewRef(commitId: string, side: "above" | "below") {
		const newName = await stackService.fetchNewBranchName(projectId);
		await createBranch({
			projectId,
			newRef: `refs/heads/${newName}`,
			placement: {
				type: "dependent",
				subject: {
					relativeTo: { type: "commit", subject: commitId },
					side,
				},
			},
		});
	}

	async function handleEditPatch(commitId: string, stackId: string) {
		if (isReadOnly) return;
		await editPatch({
			modeService,
			commitId,
			stackId,
			projectId,
		});
	}

	async function handleResolveConflictsAi(commitId: string, stackId: string) {
		if (isReadOnly || !$aiGenEnabled || !aiConfigurationValid) return;
		if (resolvingCommits.has(commitId)) return;
		resolvingCommits.add(commitId);
		const progressToastId = `resolve-conflicts-ai-${commitId}`;
		showToast({
			id: progressToastId,
			style: "info",
			title: i18nMessage("desktop:CommitContextMenu.resolvingConflictsWithAI"),
			message: i18nMessage("desktop:CommitContextMenu.thisCanTakeAMomentTheResolutionIs"),
		});
		try {
			const result = await resolveConflictsAi({ projectId, stackId, commitId });
			dismissToast(progressToastId);
			const fileList = result.files
				.map((file) => `- \`${file.path}\` — ${file.reasoning}`)
				.join("\n");
			showToast({
				style: "success",
				title: i18nMessage("desktop:CommitContextMenu.conflictsResolvedWithAI"),
				message: i18nMessage("desktop:CommitContextMenu.valueValueIfThisIsnTRightUndo", {
					value: String(result.summary ?? ""),
					fileList: String(fileList),
				}),
			});
		} catch (error: unknown) {
			dismissToast(progressToastId);
			showToast({
				style: "danger",
				title: i18nMessage("desktop:CommitContextMenu.failedToResolveConflictsWithAI"),
				error,
			});
		} finally {
			resolvingCommits.delete(commitId);
		}
	}
</script>

{#if contextData}
	<KebabButton
		{showOnHover}
		contextElement={rightClickTrigger}
		testId={TestId.KebabMenuButton}
		contextMenuTestId={TestId.CommitRowContextMenu}
	>
		{#snippet contextMenu({ close })}
			{@const { commitId, commitUrl, commitMessage } = contextData}
			{@const isLocal =
				contextData.commitStatus === "LocalAndRemote" || contextData.commitStatus === "LocalOnly"}
			{@const multiSelect = isLocal ? contextData.multiSelect : undefined}
			{@const isMultiSelect = multiSelect && multiSelect.commitIds.length > 1}

			{#if isLocal}
				{#if isMultiSelect}
					<!-- Multi-select actions -->
					<ContextMenuSection>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:CommitContextMenu.squashValueCommits", {
								length: String(multiSelect.commitIds.length),
							})}
							icon="commit-double-chevron-down"
							testId={TestId.CommitRowContextMenu_SquashSelected}
							disabled={isReadOnly}
							onclick={() => {
								if (!isReadOnly) {
									multiSelect.onSquashSelected();
									close();
								}
							}}
						/>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:CommitContextMenu.uncommitValueCommits", {
								length: String(multiSelect.commitIds.length),
							})}
							icon="undo"
							testId={TestId.CommitRowContextMenu_UncommitSelected}
							disabled={isReadOnly}
							onclick={() => {
								if (!isReadOnly) {
									multiSelect.onUncommitSelected();
									close();
								}
							}}
						/>
					</ContextMenuSection>
				{:else}
					<!-- Single-commit actions -->
					{@const { onUncommitClick, onEditMessageClick } = contextData}
					<ContextMenuSection>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:CommitContextMenu.uncommit")}
							icon="undo"
							testId={TestId.CommitRowContextMenu_UncommitMenuButton}
							disabled={isReadOnly}
							onclick={(e: MouseEvent) => {
								if (!isReadOnly) {
									onUncommitClick?.(e);
									close();
								}
							}}
						/>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:CommitContextMenu.rewordCommit")}
							icon="edit"
							testId={TestId.CommitRowContextMenu_EditMessageMenuButton}
							disabled={isReadOnly}
							onclick={(e: MouseEvent) => {
								if (!isReadOnly) {
									onEditMessageClick?.(e);
									close();
								}
							}}
						/>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:CommitContextMenu.editCommit")}
							icon="commit-edit"
							testId={TestId.CommitRowContextMenu_EditCommit}
							disabled={isReadOnly}
							onclick={async () => {
								if (!isReadOnly && contextData.stackId) {
									await handleEditPatch(commitId, contextData.stackId);
									close();
								}
							}}
						/>
						{#if contextData.hasConflicts && $aiGenEnabled && aiConfigurationValid}
							<ContextMenuItem
								label={$i18nMessages.t("desktop:CommitContextMenu.resolveConflictsWithAI")}
								icon="ai"
								testId={TestId.CommitRowContextMenu_ResolveConflictsAi}
								disabled={isReadOnly || aiResolution.current.isLoading}
								onclick={() => {
									if (!isReadOnly && contextData.stackId) {
										handleResolveConflictsAi(commitId, contextData.stackId);
										close();
									}
								}}
							/>
						{/if}
					</ContextMenuSection>
				{/if}
			{/if}

			{#if !isMultiSelect}
				<ContextMenuSection>
					{#if commitUrl}
						<ContextMenuItem
							label={$i18nMessages.t("desktop:CommitContextMenu.openInBrowser")}
							icon="open-in-browser"
							onclick={async () => {
								await urlService.openExternalUrl(commitUrl);
								close();
							}}
						/>
					{/if}
					<ContextMenuItemSubmenu
						label={$i18nMessages.t("desktop:CommitContextMenu.copy")}
						icon="copy"
					>
						{#snippet submenu({ close: closeSubmenu })}
							<ContextMenuSection>
								{#if commitUrl}
									<ContextMenuItem
										label={$i18nMessages.t("desktop:CommitContextMenu.copyCommitLink")}
										onclick={() => {
											clipboardService.write(commitUrl, {
												message: i18nMessage("desktop:CommitContextMenu.inline9f0a4b054"),
											});
											closeSubmenu();
											close();
										}}
									/>
								{/if}
								<ContextMenuItem
									label={$i18nMessages.t("desktop:CommitContextMenu.copyCommitHash")}
									onclick={() => {
										clipboardService.write(commitId, {
											message: i18nMessage("desktop:CommitContextMenu.inlinefb6ebf38a"),
										});
										closeSubmenu();
										close();
									}}
								/>
								<ContextMenuItem
									label={$i18nMessages.t("desktop:CommitContextMenu.copyCommitMessage")}
									onclick={() => {
										clipboardService.write(commitMessage, {
											message: i18nMessage("desktop:CommitContextMenu.inline33bf343d3"),
										});
										closeSubmenu();
										close();
									}}
								/>
							</ContextMenuSection>
						{/snippet}
					</ContextMenuItemSubmenu>
					{#if isLocal}
						<ContextMenuItemSubmenu
							label={$i18nMessages.t("desktop:CommitContextMenu.addEmptyCommit")}
							icon="commit-plus"
						>
							{#snippet submenu({ close: closeSubmenu })}
								<ContextMenuSection>
									<ContextMenuItem
										label={$i18nMessages.t("desktop:CommitContextMenu.addEmptyCommitAbove")}
										disabled={isReadOnly || commitInsertion.current.isLoading}
										onclick={() => {
											insertBlankCommit(commitId, "above");
											closeSubmenu();
											close();
										}}
									/>
									<ContextMenuItem
										label={$i18nMessages.t("desktop:CommitContextMenu.addEmptyCommitBelow")}
										disabled={isReadOnly || commitInsertion.current.isLoading}
										onclick={() => {
											insertBlankCommit(commitId, "below");
											closeSubmenu();
											close();
										}}
									/>
								</ContextMenuSection>
							{/snippet}
						</ContextMenuItemSubmenu>
						<ContextMenuItemSubmenu
							label={$i18nMessages.t("desktop:CommitContextMenu.createBranch")}
							icon="branch"
						>
							{#snippet submenu({ close: closeSubmenu })}
								<ContextMenuSection>
									<ContextMenuItem
										label={$i18nMessages.t("desktop:CommitContextMenu.addBranchAbove")}
										disabled={isReadOnly || branchCreation.current.isLoading}
										onclick={async () => {
											if (!isReadOnly) {
												await handleCreateNewRef(commitId, "above");
												closeSubmenu();
												close();
											}
										}}
									/>
									<ContextMenuItem
										label={$i18nMessages.t("desktop:CommitContextMenu.addBranchBelow")}
										disabled={isReadOnly || branchCreation.current.isLoading}
										onclick={async () => {
											if (!isReadOnly) {
												await handleCreateNewRef(commitId, "below");
												closeSubmenu();
												close();
											}
										}}
									/>
								</ContextMenuSection>
							{/snippet}
						</ContextMenuItemSubmenu>
					{/if}
				</ContextMenuSection>

				<ContextMenuSection>
					<ContextMenuItem
						label={$rewrapCommitMessage
							? $i18nMessages.t("desktop:CommitContextMenu.inline12d6e7f2a")
							: $i18nMessages.t("desktop:CommitContextMenu.inlineec50fb0ed")}
						icon="text-wrap"
						disabled={commitInsertion.current.isLoading}
						onclick={() => {
							rewrapCommitMessage.set(!$rewrapCommitMessage);
							close();
						}}
					/>
				</ContextMenuSection>
			{/if}
		{/snippet}
	</KebabButton>
{/if}
