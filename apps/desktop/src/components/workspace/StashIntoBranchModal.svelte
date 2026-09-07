<script lang="ts">
	import BranchNameTextbox from "$components/branch/BranchNameTextbox.svelte";
	import { changesToDiffSpec } from "$lib/commits/utils";
	import { autoSelectBranchCreationFeature } from "$lib/config/uiFeatureFlags";
	import { isTreeChange } from "$lib/hunks/change";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { AsyncButton, Button, Modal } from "@gitbutler/ui";
	import type { TreeChange } from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

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

	type ChangedFolderItem = ChangedFilesItem & { path: string };

	function isChangedFolderItem(item: ChangedFilesItem): item is ChangedFolderItem {
		return "path" in item && typeof item.path === "string";
	}

	type Props = {
		projectId: string;
	};

	const { projectId }: Props = $props();

	const stackService = inject(STACK_SERVICE);

	let modal: ReturnType<typeof Modal> | undefined;
	let stashBranchName = $state<string>();
	let normalizedRefName: string | undefined = $state();
	let isStashBranchNameValid = $state(false);
	let stashBranchNameInput = $state<ReturnType<typeof BranchNameTextbox>>();

	export async function show(item: ChangedFilesItem) {
		normalizedRefName = undefined;
		isStashBranchNameValid = false;
		modal?.show(item);
		stashBranchName = await stackService.fetchNewBranchName(projectId);
		if ($autoSelectBranchCreationFeature) {
			await stashBranchNameInput?.selectAll();
		}
	}

	async function confirmStashIntoBranch(item: ChangedFilesItem, branchName: string | undefined) {
		if (!branchName) return;

		await stackService.stashIntoBranch({
			projectId,
			branchName,
			worktreeChanges: changesToDiffSpec(item.changes),
		});

		modal?.close();
	}
</script>

<Modal
	width={434}
	type="info"
	title={$i18nMessages.t("desktop:StashIntoBranchModal.stashChangesIntoANewBranch")}
	bind:this={modal}
>
	{#snippet children(item)}
		<div class="content-wrap">
			<BranchNameTextbox
				bind:this={stashBranchNameInput}
				id="stashBranchName"
				placeholder={$i18nMessages.t("desktop:StashIntoBranchModal.enterYourBranchName")}
				bind:value={stashBranchName}
				autofocus
				onnormalizedvalue={(value) => (normalizedRefName = value)}
				onvalidationchange={(isValid) => (isStashBranchNameValid = isValid)}
			/>
			<div class="explanation">
				<p class="primary-text">
					{#if isChangedFilesItem(item) && isChangedFolderItem(item)}
						{$i18nMessages.t("desktop:StashIntoBranchModal.allChangesInThisFolder")}
					{:else}
						{$i18nMessages.t("desktop:StashIntoBranchModal.yourSelectedChanges")}
					{/if}
					{$i18nMessages.t("desktop:StashIntoBranchModal.willBeMovedToANewBranchAnd")}
				</p>
			</div>

			<div class="technical-note">
				<p class="text-12 text-body clr-text-2">
					{$i18nMessages.t("desktop:StashIntoBranchModal.thisCreatesANewBranchCommitsYourChanges")}
				</p>
			</div>
		</div>
	{/snippet}
	{#snippet controls(close, item)}
		<Button kind="outline" type="reset" onclick={close}
			>{$i18nMessages.t("desktop:StashIntoBranchModal.cancel")}</Button
		>
		<AsyncButton
			style="pop"
			disabled={!isStashBranchNameValid}
			type="submit"
			action={async () => {
				if (isChangedFilesItem(item)) await confirmStashIntoBranch(item, normalizedRefName);
			}}
		>
			{$i18nMessages.t("desktop:StashIntoBranchModal.stashIntoBranch")}
		</AsyncButton>
	{/snippet}
</Modal>

<style lang="postcss">
	.content-wrap {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
