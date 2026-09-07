<script lang="ts" module>
	export type AddDependentBranchModalProps = {
		projectId: string;
		stackId: string;
		branchReference: string;
	};
</script>

<script lang="ts">
	import BranchNameTextbox from "$components/branch/BranchNameTextbox.svelte";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal, TestId } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const { projectId, branchReference }: AddDependentBranchModalProps = $props();

	const stackService = inject(STACK_SERVICE);
	const [createBranch, branchCreation] = stackService.branchCreate;

	let modal = $state<Modal>();
	let branchName = $state<string>();
	let normalizedRefName: string | undefined = $state();
	let isBranchNameValid = $state(false);

	async function handleAddDependentBranch(close: () => void) {
		if (!normalizedRefName) return;

		const newRef = `refs/heads/${normalizedRefName}`;
		await createBranch({
			projectId,
			newRef,
			placement: {
				type: "dependent",
				subject: {
					relativeTo: { type: "reference", subject: branchReference },
					side: "above",
				},
			},
		});

		close();
	}

	export function show() {
		modal?.show();
	}
</script>

<Modal
	testId={TestId.BranchHeaderAddDependanttBranchModal}
	bind:this={modal}
	width="small"
	title={$i18nMessages.t("desktop:AddDependentBranchModal.addDependentBranch")}
	onSubmit={handleAddDependentBranch}
>
	<div class="content-wrap">
		<BranchNameTextbox
			placeholder={$i18nMessages.t("desktop:AddDependentBranchModal.branchName")}
			bind:value={branchName}
			autofocus
			onnormalizedvalue={(value) => (normalizedRefName = value)}
			onvalidationchange={(isValid) => (isBranchNameValid = isValid)}
		/>
	</div>
	{#snippet controls(close)}
		<Button kind="outline" type="reset" onclick={close}
			>{$i18nMessages.t("desktop:AddDependentBranchModal.cancel")}</Button
		>
		<Button
			testId={TestId.BranchHeaderAddDependanttBranchModal_ActionButton}
			style="pop"
			type="submit"
			disabled={!isBranchNameValid}
			loading={branchCreation.current.isLoading}
			>{$i18nMessages.t("desktop:AddDependentBranchModal.addBranch")}</Button
		>
	{/snippet}
</Modal>
