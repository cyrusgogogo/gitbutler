<!-- This is a V3 replacement for `FileContextMenu.svelte` -->
<script lang="ts">
	import AbsorbPlanModal from "$components/stack/AbsorbPlanModal.svelte";
	import DiscardChangesModal from "$components/workspace/DiscardChangesModal.svelte";
	import StashIntoBranchModal from "$components/workspace/StashIntoBranchModal.svelte";
	import { BACKEND } from "$lib/backend";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { getEditorUri, URL_SERVICE } from "$lib/backend/url";
	import { changesToDiffSpec } from "$lib/commits/utils";
	import { FILE_SERVICE } from "$lib/files/fileService";
	import { isTreeChange } from "$lib/hunks/change";
	import { vscodePath } from "$lib/project/project";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { FILE_SELECTION_MANAGER } from "$lib/selection/fileSelectionManager.svelte";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { UI_STATE, withStackBusy } from "$lib/state/uiState.svelte";
	import { WORKTREE_SERVICE } from "$lib/worktree/worktreeService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		ContextMenu,
		ContextMenuItem,
		ContextMenuItemSubmenu,
		ContextMenuSection,
		chipToasts,
		TestId,
	} from "@gitbutler/ui";
	import type { SelectionId } from "$lib/selection/key";
	import type { TreeChange } from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		stackId: string | undefined;
		selectionId: SelectionId;
		trigger?: HTMLElement;
		leftClickTrigger?: HTMLElement;
		editMode?: boolean;
		align?: "start" | "center" | "end";
		onopen?: () => void;
		onclose?: () => void;
	};

	type ChangedFilesItem = {
		changes: TreeChange[];
	};

	function isChangedFilesItem(item: unknown): item is ChangedFilesItem {
		return (
			typeof item === "object" &&
			item !== null &&
			"changes" in item &&
			Array.isArray(item.changes) &&
			item.changes.every(isTreeChange)
		);
	}

	type ChangedFolderItem = ChangedFilesItem & {
		path: string;
	};

	function isChangedFolderItem(item: ChangedFilesItem): item is ChangedFolderItem {
		return "path" in item && typeof item.path === "string";
	}

	/** An uncommitted file with an unresolved index conflict; it has a path but no change yet. */
	type ConflictedFileItem = ChangedFolderItem & {
		conflicted: true;
	};

	function isConflictedFileItem(item: ChangedFilesItem): item is ConflictedFileItem {
		return "conflicted" in item && item.conflicted === true;
	}

	const {
		trigger,
		leftClickTrigger,
		selectionId,
		stackId,
		projectId,
		editMode = false,
		align,
		onopen,
		onclose,
	}: Props = $props();
	const stackService = inject(STACK_SERVICE);
	const worktreeService = inject(WORKTREE_SERVICE);
	const uiState = inject(UI_STATE);
	const defaultCodeEditor = uiState.global.defaultCodeEditor;
	const idSelection = inject(FILE_SELECTION_MANAGER);
	const fileService = inject(FILE_SERVICE);
	const urlService = inject(URL_SERVICE);
	const clipboardService = inject(CLIPBOARD_SERVICE);
	const backend = inject(BACKEND);
	const [, absorbingChanges] = stackService.absorb;
	const projectService = inject(PROJECTS_SERVICE);

	const isUncommitted = $derived(selectionId.type === "worktree");

	// Platform-specific label for "Show in Finder/Explorer/File Manager"
	const showInFolderLabel = (() => {
		switch (backend.platformName) {
			case "macos":
				return $i18nMessages.t("desktop:ChangedFilesContextMenu.detailf1ec2b16e");
			case "windows":
				return $i18nMessages.t("desktop:ChangedFilesContextMenu.detail1cc1dd483");
			default:
				return $i18nMessages.t("desktop:ChangedFilesContextMenu.detail5dc187419");
		}
	})();

	let menuOpen = $state(false);
	let menuTarget = $state<MouseEvent | HTMLElement>();
	let menuItem = $state<ChangedFilesItem>();

	let discardModal: ReturnType<typeof DiscardChangesModal>;
	let stashModal: ReturnType<typeof StashIntoBranchModal>;
	let absorbModal: ReturnType<typeof AbsorbPlanModal>;

	function isDeleted(item: ChangedFilesItem): boolean {
		if (isChangedFolderItem(item)) {
			return false;
		}
		return item.changes.some((change) => {
			return change.status.type === "Deletion";
		});
	}

	function getItemPath(item: ChangedFilesItem): string | null {
		if (isChangedFolderItem(item)) {
			return item.path;
		}
		if (item.changes.length === 1) {
			return item.changes[0]!.path;
		}
		return null;
	}

	export function open(
		e: MouseEvent | HTMLElement,
		newItem: ChangedFilesItem | ChangedFolderItem | ConflictedFileItem,
	) {
		menuTarget = e;
		menuItem = newItem;
		menuOpen = true;
	}

	export function close() {
		menuOpen = false;
	}

	async function uncommitChanges(stackId: string, commitId: string, changes: TreeChange[]) {
		menuOpen = false;
		await withStackBusy(uiState, projectId, { commitId, stackIds: [stackId] }, async () => {
			await stackService.uncommitChanges({
				projectId,
				stackId,
				commitId,
				changes: changesToDiffSpec(changes),
				dryRun: false,
			});
			const selectedFiles = changes.map((change) => ({ ...selectionId, path: change.path }));

			// Unselect the uncommitted files
			idSelection.removeMany(selectedFiles);
		});
	}
</script>

{#if menuOpen && menuItem}
	{@const item = menuItem}
	{@const deletion = isDeleted(item)}
	{@const itemPath = getItemPath(item)}
	<ContextMenu
		{leftClickTrigger}
		rightClickTrigger={trigger}
		side="bottom"
		{align}
		target={menuTarget}
		{onopen}
		onclose={() => {
			menuOpen = false;
			onclose?.();
		}}
	>
		{#if isChangedFilesItem(item)}
			{#if isConflictedFileItem(item)}
				<ContextMenuSection>
					<ContextMenuItem
						label={$i18nMessages.t("desktop:ChangedFilesContextMenu.markAsResolved")}
						icon="tick"
						onclick={() => {
							menuOpen = false;
							worktreeService.resolveWorktreeConflicts({ projectId, paths: [item.path] });
						}}
					/>
				</ContextMenuSection>
			{/if}
			{#if item.changes.length > 0 && !editMode}
				<ContextMenuSection>
					{@const changes = item.changes}
					{#if isUncommitted}
						<ContextMenuItem
							label={$i18nMessages.t("desktop:ChangedFilesContextMenu.discardChanges")}
							testId={TestId.FileListItemContextMenu_DiscardChanges}
							icon="bin"
							onclick={() => {
								discardModal.show(item);
								menuOpen = false;
							}}
						/>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:ChangedFilesContextMenu.stashIntoBranch")}
							icon="branch-bottom-up-arrow"
							onclick={() => {
								stashModal.show(item);
								menuOpen = false;
							}}
						/>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:ChangedFilesContextMenu.absorbChanges")}
							icon="commit-absorb"
							testId={TestId.FileListItemContextMenu_Absorb}
							onclick={() => {
								absorbModal.show(item.changes);
								menuOpen = false;
							}}
							disabled={absorbingChanges.current.isLoading}
						/>
					{/if}
					{#if selectionId.type === "commit" && stackId && !editMode}
						{@const commitId = selectionId.commitId}
						<ContextMenuItem
							label={$i18nMessages.t("desktop:ChangedFilesContextMenu.uncommitChanges")}
							icon="commit-undo"
							onclick={async () => uncommitChanges(stackId, commitId, changes)}
						/>
					{/if}
				</ContextMenuSection>
			{/if}

			{#if itemPath}
				<ContextMenuSection>
					<ContextMenuItemSubmenu
						label={$i18nMessages.t("desktop:ChangedFilesContextMenu.copyPath")}
						icon="copy"
					>
						{#snippet submenu(_sub)}
							<ContextMenuSection>
								<ContextMenuItem
									label={$i18nMessages.t("desktop:ChangedFilesContextMenu.copyPath")}
									onclick={async () => {
										menuOpen = false;
										const project = await projectService.fetchProject(projectId);
										const projectPath = project?.path;
										if (projectPath) {
											const absPath = await backend.joinPath(projectPath, itemPath);

											await clipboardService.write(absPath, {
												message: i18nMessage("desktop:ChangedFilesContextMenu.inline0d3323e0a"),
												errorMessage: i18nMessage(
													"desktop:ChangedFilesContextMenu.inline07c9c055f",
												),
											});
										}
									}}
								/>
								<ContextMenuItem
									label={$i18nMessages.t("desktop:ChangedFilesContextMenu.copyRelativePath")}
									onclick={async () => {
										menuOpen = false;
										await clipboardService.write(itemPath, {
											message: i18nMessage("desktop:ChangedFilesContextMenu.inline90c67ab35"),
											errorMessage: i18nMessage("desktop:ChangedFilesContextMenu.inline54c26c446"),
										});
									}}
								/>
							</ContextMenuSection>
						{/snippet}
					</ContextMenuItemSubmenu>
				</ContextMenuSection>
			{/if}

			<ContextMenuSection>
				{#if !isChangedFolderItem(item) || isConflictedFileItem(item)}
					{@const pathsToOpen = isConflictedFileItem(item)
						? [item.path]
						: item.changes.map((change) => change.path)}
					<ContextMenuItem
						label={$i18nMessages.t("desktop:ChangedFilesContextMenu.openInValue", {
							displayName: String(defaultCodeEditor.current.displayName),
						})}
						icon="open-in-ide"
						disabled={deletion}
						onclick={async () => {
							menuOpen = false;
							try {
								const project = await projectService.fetchProject(projectId);
								const projectPath = project?.path;
								if (projectPath) {
									for (const relativePath of pathsToOpen) {
										const path = getEditorUri({
											schemeId: defaultCodeEditor.current.schemeIdentifer,
											path: [vscodePath(projectPath), relativePath],
										});
										urlService.openExternalUrl(path);
									}
								}
							} catch {
								chipToasts.error(i18nMessage("desktop:ChangedFilesContextMenu.inline6b86caef4"));
								console.error($i18nMessages.t("desktop:ChangedFilesContextMenu.inline6b86caef4"));
							}
						}}
					/>
				{/if}
				{#if itemPath}
					<ContextMenuItem
						label={showInFolderLabel}
						icon="open-in-folder"
						onclick={async () => {
							menuOpen = false;
							const project = await projectService.fetchProject(projectId);
							const projectPath = project?.path;
							if (projectPath) {
								const absPath = await backend.joinPath(projectPath, itemPath);
								await fileService.showFileInFolder(absPath);
							}
						}}
					/>
				{/if}
			</ContextMenuSection>
		{:else}
			<ContextMenuSection>
				<p class="text-13">
					{$i18nMessages.t("desktop:ChangedFilesContextMenu.woopsMalformedData")}
				</p>
			</ContextMenuSection>
		{/if}
	</ContextMenu>
{/if}

<DiscardChangesModal bind:this={discardModal} {projectId} {selectionId} />
<StashIntoBranchModal bind:this={stashModal} {projectId} />
<AbsorbPlanModal bind:this={absorbModal} {projectId} {stackId} />
