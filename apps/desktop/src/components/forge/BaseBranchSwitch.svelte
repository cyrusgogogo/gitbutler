<script lang="ts">
	import { BASE_BRANCH_SERVICE } from "$lib/baseBranch/baseBranchService.svelte";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, CardGroup, InfoMessage, Select, SelectItem } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId: string } = $props();

	const stackService = inject(STACK_SERVICE);
	const baseBranchService = inject(BASE_BRANCH_SERVICE);
	const settingsStore = inject(SETTINGS_SERVICE).appSettings;
	const baseBranchQuery = $derived(baseBranchService.baseBranch(projectId));
	const baseBranch = $derived(baseBranchQuery.response);
	const remoteBranchesQuery = $derived(baseBranchService.remoteBranches(projectId));
	const [setBaseBranchTarget, targetBranchSwitch] = baseBranchService.setTarget;
	const [setBaseBranchTargetRef, targetRefSwitch] = baseBranchService.setTargetRef;

	let selectedBranch = $derived(baseBranch?.branchName);
	let selectedRemote = $derived(baseBranch?.pushRemoteName);

	const stacksQuery = $derived(stackService.stacks(projectId));
	const stackCount = $derived(stacksQuery.response?.length);
	const targetChangeDisabled = $derived(!!(stackCount && stackCount > 0));

	function uniqueRemotes(remoteBranches: { name: string }[]): { name: string }[] {
		return Array.from(new Set(remoteBranches.map((b) => b.name.split("/")[0])))
			.filter((name): name is string => !!name)
			.map((r) => ({
				name: r,
			}));
	}

	const switching = $derived(
		targetBranchSwitch.current.isLoading || targetRefSwitch.current.isLoading,
	);
	// With the singleBranch feature flag, only the target metadata is rewritten
	// and no branch is checked out, so avoid claiming a branch switch.
	const switchingLabel = $derived(
		$settingsStore?.featureFlags.singleBranch
			? $i18nMessages.t("desktop:BaseBranchSwitch.detail93d7d52f0")
			: $i18nMessages.t("desktop:BaseBranchSwitch.detail25902b94f"),
	);

	async function switchTarget(branch: string, pushRemote?: string) {
		if ($settingsStore?.featureFlags.singleBranch) {
			// Only update the target; the user keeps working on their current branch.
			await setBaseBranchTargetRef({ projectId, targetRef: `refs/remotes/${branch}`, pushRemote });
		} else {
			await setBaseBranchTarget({ projectId, branch, pushRemote });
		}
	}

	async function onSetBaseBranchClick() {
		if (!selectedBranch) return;

		if (selectedRemote) {
			await switchTarget(selectedBranch, selectedRemote);
		} else {
			await switchTarget(selectedBranch);
		}
	}
</script>

{#if remoteBranchesQuery.result.isLoading}
	<InfoMessage filled outlined={false} icon="info">
		{#snippet content()}
			{$i18nMessages.t("desktop:BaseBranchSwitch.loadingRemoteBranches")}
		{/snippet}
	</InfoMessage>
{:else if remoteBranchesQuery.result.isSuccess}
	{@const remoteBranches = remoteBranchesQuery.response}
	{#if remoteBranches && remoteBranches.length > 0}
		{@const remotes = uniqueRemotes(remoteBranches)}
		<CardGroup>
			<CardGroup.Item>
				{#snippet title()}
					{$i18nMessages.t("desktop:BaseBranchSwitch.remoteConfiguration")}
				{/snippet}
				{#snippet caption()}
					{$i18nMessages.t("desktop:BaseBranchSwitch.letsYouChooseWhereToPushCodeAnd")}
				{/snippet}

				<Select
					value={selectedBranch}
					options={remoteBranches.map((b) => ({ label: b.name, value: b.name }))}
					wide
					onselect={(value) => {
						selectedBranch = value;
					}}
					disabled={targetChangeDisabled}
					label={$i18nMessages.t("desktop:BaseBranchSwitch.currentTargetBranch")}
					searchable
				>
					{#snippet itemSnippet({ item, highlighted })}
						<SelectItem selected={item.value === selectedBranch} {highlighted}>
							{item.label}
						</SelectItem>
					{/snippet}
				</Select>

				{#if remotes.length > 1}
					<Select
						value={selectedRemote}
						options={remotes.map((r) => ({ label: r.name, value: r.name }))}
						wide
						onselect={(value) => {
							selectedRemote = value;
						}}
						disabled={targetChangeDisabled}
						label={$i18nMessages.t("desktop:BaseBranchSwitch.createBranchesOnRemote")}
					>
						{#snippet itemSnippet({ item, highlighted })}
							<SelectItem selected={item.value === selectedRemote} {highlighted}>
								{item.label}
							</SelectItem>
						{/snippet}
					</Select>
				{/if}

				{#if targetChangeDisabled}
					<InfoMessage filled outlined={false} icon="info">
						{#snippet content()}
							{$i18nMessages.t("desktop:workspace.clearBeforeBaseSwitch", {
								count: stackCount ?? 0,
							})}
						{/snippet}
					</InfoMessage>
				{:else}
					<Button
						kind="outline"
						onclick={onSetBaseBranchClick}
						id="set-base-branch"
						loading={switching}
						disabled={(selectedBranch === baseBranch?.branchName &&
							selectedRemote === baseBranch?.pushRemoteName) ||
							targetChangeDisabled}
					>
						{switching
							? switchingLabel
							: $i18nMessages.t("desktop:BaseBranchSwitch.updateConfiguration")}
					</Button>
				{/if}
			</CardGroup.Item>
		</CardGroup>
	{/if}
{:else if remoteBranchesQuery.result.isError}
	<InfoMessage filled outlined={true} style="danger">
		{#snippet title()}
			{$i18nMessages.t("desktop:BaseBranchSwitch.weGotAnErrorTryingToListYour")}
		{/snippet}
	</InfoMessage>
{/if}
