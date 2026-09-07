<script lang="ts">
	import FileListItems from "$components/files/FileListItems.svelte";
	import FileListProvider from "$components/files/FileListProvider.svelte";
	import SnapshotSection from "$components/history/SnapshotSection.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { createdOnDay, HISTORY_SERVICE } from "$lib/history/history";
	import { MODE_SERVICE } from "$lib/mode/modeService";
	import { toHumanReadableTime } from "$lib/utils/time";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Icon, ScrollableContainer, type IconName } from "@gitbutler/ui";
	import { focusable } from "@gitbutler/ui/focus/focusable";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { untrack } from "svelte";
	import type { Snapshot, SnapshotDetails } from "$lib/history/types";
	const i18nMessages = useTranslations();

	interface Props {
		entry: Snapshot;
		childId?: string;
		isWithinRestore?: boolean;
		restoring?: boolean;
		onRestoreClick: () => void;
		onDiffClick: (filePath: string) => void;
		projectId: string;
	}

	const {
		projectId,
		entry,
		childId,
		isWithinRestore = true,
		restoring = false,
		onRestoreClick,
		onDiffClick,
	}: Props = $props();

	function getShortSha(sha: string | undefined) {
		if (!sha) return "";

		return $i18nMessages.t("desktop:SnapshotCard.detail5cb90a99f", {
			value1: String(sha.slice(0, 7)),
		});
	}

	function createdOnDayAndTime(epochMs: number) {
		return $i18nMessages.t("desktop:SnapshotCard.detail73ed1c8c5", {
			value1: String(createdOnDay(epochMs, $i18nMessages.locale)),
			value2: String(toHumanReadableTime(new Date(epochMs), $i18nMessages.locale)),
		});
	}

	function camelToTitleCase(str: string | undefined) {
		if (!str) return "";
		const lowerCaseStr = str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
		return lowerCaseStr.charAt(0).toUpperCase() + lowerCaseStr.slice(1);
	}

	function mapOperation(snapshotDetails: SnapshotDetails | undefined): {
		text: string;
		icon?: IconName;
		commitMessage?: string;
	} {
		if (!snapshotDetails) return { text: "", icon: "commit" };

		function trailer(...keys: string[]) {
			for (const key of keys) {
				const value = snapshotDetails?.trailers.find((t) => t.key === key)?.value;
				if (value !== undefined) return value;
			}
		}
		function entryTrailer(key: string) {
			return entry.details?.trailers.find((t) => t.key === key)?.value;
		}

		switch (snapshotDetails.operation) {
			// REMOVE
			case "DeleteBranch":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail5c98e4552", {
						value1: String(entryTrailer("name")),
					}),
					icon: "cross",
				};
			case "DiscardLines":
			case "DiscardHunk":
			case "DiscardFile":
				return { text: camelToTitleCase(snapshotDetails.operation), icon: "cross" };

			// ADD
			case "CreateBranch":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail5a3a06529", {
						value1: String(trailer("name")),
					}),
					icon: "plus",
				};
			case "CreateCommit":
			case "InsertBlankCommit":
				return {
					text:
						snapshotDetails.operation === "CreateCommit"
							? $i18nMessages.t("desktop:SnapshotCard.detailb6d3f8a5c", {
									value1: String(getShortSha(entryTrailer("sha"))),
								})
							: $i18nMessages.t("desktop:SnapshotCard.detail7668fa745"),
					icon: "plus",
					commitMessage: entryTrailer("message"),
				};

			// EDIT
			case "UpdateBranchName":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detailb6be86e66", {
						value1: String(trailer("previous_name", "before")),
						value2: String(trailer("name", "after")),
					}),
					icon: "edit",
				};
			case "UpdateBranchRemoteName":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail01a1edc9a", {
						value1: String(trailer("before")),
						value2: String(trailer("after")),
					}),
					icon: "edit",
				};
			case "AmendCommit":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail1af5edc91"), icon: "edit" };
			case "UpdateCommitMessage":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail09bcb2a3e"), icon: "edit" };
			case "EnterEditMode":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail7138a62fb"), icon: "edit" };

			// BRANCH
			case "ApplyBranch":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detailef19c4063", {
						value1: String(entryTrailer("name")),
					}),
					icon: "branch",
				};
			case "UnapplyBranch":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail31ced2b8b", {
						value1: String(trailer("branch")),
					}),
					icon: "branch",
				};
			case "SwitchBranch":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail693400c29"), icon: "branch" };
			case "SwitchToWorkspace":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detaile78af8291"), icon: "branch" };
			case "ReorderBranches":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detaild4fbd935c", {
						value1: String(trailer("before")),
						value2: String(trailer("after")),
					}),
					icon: "branch",
				};
			case "SelectDefaultVirtualBranch":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detailf30a3bb4f", {
						value1: String(trailer("after")),
					}),
					icon: "branch",
				};
			case "SetBaseBranch":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail1b1ee22b9"), icon: "branch" };
			case "GenericBranchUpdate":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detailafdb0c9a9"), icon: "branch" };
			case "SplitBranch":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detailde214d5b9"), icon: "branch" };
			case "MoveBranch":
			case "TearOffBranch":
				return { text: camelToTitleCase(snapshotDetails.operation), icon: "branch" };

			// COMMIT
			case "UndoCommit":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail3c5094196", {
						value1: String(getShortSha(entryTrailer("sha"))),
					}),
					icon: "undo",
					commitMessage: entryTrailer("message"),
				};
			case "DiscardCommit":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail7b15a9d0c", {
						value1: String(getShortSha(entryTrailer("sha"))),
					}),
					icon: "cross",
					commitMessage: entryTrailer("message"),
				};
			case "SquashCommit":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail9bde37f7e"),
					icon: "commit-arrow-down",
				};
			case "MoveCommit":
			case "ReorderCommit":
				return { text: camelToTitleCase(snapshotDetails.operation), icon: "commit" };
			case "MoveCommitFile":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detaila9be6a1be"), icon: "commit" };
			case "Absorb":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail178e0da92"),
					icon: "commit-absorb",
				};
			case "AutoCommit":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detailefb03ce8d"), icon: "commit-ai" };

			// FILE
			case "MoveHunk":
				return {
					text: $i18nMessages.t("desktop:SnapshotCard.detail33986a00d", {
						value1: String(entryTrailer("name")),
					}),
					icon: "file",
				};
			case "FileChanges":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail663da9347"), icon: "file" };

			// OTHER
			case "MergeUpstream":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detailf1f7438f7"), icon: "pr-tick" };
			case "UpdateWorkspaceBase":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail3358924f1"), icon: "refresh" };
			case "RestoreFromSnapshot":
			case "RestoreFromSnapshotViaUndo":
			case "RestoreFromSnapshotViaRedo":
				return { text: $i18nMessages.t("desktop:SnapshotCard.detail50448d1e0") };
			case "OnDemandSnapshot":
				return {
					text: snapshotDetails.body
						? $i18nMessages.t("desktop:SnapshotCard.detailbfa29883c", {
								value1: String(snapshotDetails.body),
							})
						: $i18nMessages.t("desktop:SnapshotCard.detail54ff1f896"),
					icon: "camera",
				};
			default:
				return { text: snapshotDetails.operation, icon: "commit" };
		}
	}

	const isRestoreSnapshot = untrack(
		() =>
			entry.details?.operation === "RestoreFromSnapshot" ||
			entry.details?.operation === "RestoreFromSnapshotViaUndo" ||
			entry.details?.operation === "RestoreFromSnapshotViaRedo",
	);
	const error = untrack(() => entry.details?.trailers.find((t) => t.key === "error")?.value);

	const operation = mapOperation(untrack(() => entry.details));

	const modeService = inject(MODE_SERVICE);
	const mode = $derived(modeService.mode(projectId));

	const historyService = inject(HISTORY_SERVICE);
	const snapshotDiff = $derived(
		historyService.snapshotDiff({ projectId, snapshotId: entry.commitId, childId }),
	);
</script>

<div
	class="snapshot-card show-restore-on-hover"
	class:restored-snapshot={isRestoreSnapshot || isWithinRestore}
	use:focusable={{ focusable: true }}
>
	<div class="snapshot-right-container">
		<div class="restore-btn">
			<Button
				size="tag"
				kind="outline"
				tooltip={$i18nMessages.t("desktop:SnapshotCard.restoresGitButlerAndYourFilesToTheState")}
				onclick={() => {
					onRestoreClick();
				}}
				disabled={restoring || mode.response?.type !== "OpenWorkspace"}
				loading={restoring}>{$i18nMessages.t("desktop:SnapshotCard.revert")}</Button
			>
		</div>
		<span class="snapshot-time text-11">
			{toHumanReadableTime(new Date(entry.createdAt), $i18nMessages.locale)}
		</span>
	</div>

	<div class="snapshot-line">
		{#if isRestoreSnapshot}
			<img src="/images/history/restore-icon.svg" alt="" />
		{:else if operation.icon}
			<Icon name={operation.icon} />
		{/if}
	</div>

	<div class="snapshot-content">
		<div class="snapshot-details">
			<h4 class="snapshot-title text-13 text-body text-semibold">
				<span>{operation.text}</span>
				<span class="snapshot-sha text-12 text-body"> • {getShortSha(entry.commitId)}</span>
			</h4>

			{#if operation.commitMessage}
				<p class="text-12 text-body snapshot-commit-message">
					{#snippet i18nSlot1(content: import("svelte").Snippet)}<span>{@render content()}</span
						>{/snippet}
					<I18nRichMessage
						value={{
							key: "desktop:SnapshotCard.messageValue",
							values: { commitMessage: String(operation.commitMessage) },
						}}
						components={{ slot1: i18nSlot1 }}
					/>
				</p>
			{/if}
		</div>

		<ReduxResult result={snapshotDiff.result} {projectId}>
			{#snippet children(files)}
				{#if files.length > 0 && !isRestoreSnapshot}
					<FileListProvider
						changes={files}
						selectionId={{ type: "snapshot", snapshotId: entry.commitId }}
						allowUnselect={false}
					>
						<SnapshotSection
							foldable={files.length > 2}
							foldedAmount={files.length}
							foldedHeight="7rem"
						>
							<ScrollableContainer>
								<FileListItems
									{projectId}
									mode="list"
									onselect={(change) => onDiffClick(change.path)}
								/>
							</ScrollableContainer>
						</SnapshotSection>
					</FileListProvider>
				{/if}
			{/snippet}
		</ReduxResult>

		{#if isRestoreSnapshot}
			<SnapshotSection>
				<div class="restored-attacment">
					<Icon name="commit" />
					<div class="restored-attacment__content">
						<h4 class="text-13 text-semibold">
							{camelToTitleCase(
								entry.details?.trailers.find((t) => t.key === "restored_operation")?.value,
							)}
						</h4>
						<span class="restored-attacment__details text-12">
							{getShortSha(entry.details?.trailers.find((t) => t.key === "restored_from")?.value)} •
							{createdOnDayAndTime(
								parseInt(
									entry.details?.trailers.find((t) => t.key === "restored_date")?.value || "",
								),
							)}
						</span>
					</div>
				</div>
			</SnapshotSection>
		{/if}
		{#if error}
			<div class="error-text text-12 text-body">
				{error}
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	/* SNAPSHOT CARD */
	.snapshot-card {
		display: flex;
		position: relative;
		padding: 10px 14px 8px 14px;
		overflow: hidden;
		gap: 12px;
		background-color: var(--bg-1);
		transition: padding 0.2s;
	}

	.show-restore-on-hover {
		&:hover {
			background-color: var(--hover-bg-1);
			& .restore-btn {
				display: flex;
			}
			& .snapshot-time {
				display: none;
			}
		}
	}

	.show-restore-on-hover:global(.focused) {
		background-color: var(--hover-bg-1);
		& .restore-btn {
			display: flex;
		}
		& .snapshot-time {
			display: none;
		}
	}

	.snapshot-right-container {
		display: flex;
		justify-content: flex-end;
		width: 60px;
	}

	.restore-btn {
		display: none;
	}

	.snapshot-time {
		margin-top: 2px;
		color: var(--text-2);
		line-height: 1.8;
		text-align: right;
	}

	.snapshot-line {
		display: flex;
		position: relative;
		flex-direction: column;
		align-items: center;
		margin-top: 3px;

		&::after {
			position: absolute;
			top: 24px;
			width: 1px;
			height: calc(100% - 14px);
			min-height: 8px;
			background-color: var(--border-2);
			content: "";
		}
	}

	/* CARD CONTENT */
	.snapshot-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: flex-start;
		min-height: var(--size-tag);
		overflow: hidden;
		gap: 6px;
	}

	.snapshot-details {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		margin-top: 2px;
		margin-bottom: 4px;
		gap: 6px;
	}

	.snapshot-title {
		flex: 1;
	}

	.snapshot-commit-message {
		margin-bottom: 2px;
		color: var(--text-2);

		& span {
			color: var(--text-3);
		}
	}

	.snapshot-sha {
		color: var(--text-3);
		white-space: nowrap;
	}

	/* ATTACHMENT RESTORE */
	.restored-attacment {
		display: flex;
		padding: 12px;
		gap: 8px;
	}

	.restored-attacment__content {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.restored-attacment__details {
		color: var(--text-2);
	}

	/* RESTORED  */
	.restored-snapshot {
		background-color: var(--bg-2);
	}

	/* --- */
	.error-text {
		display: flex;
		width: 100%;
		padding: 6px 10px;
		border-radius: var(--radius-m);
		background-color: var(--bg-danger);
		color: var(--fill-danger-bg);
	}
</style>
