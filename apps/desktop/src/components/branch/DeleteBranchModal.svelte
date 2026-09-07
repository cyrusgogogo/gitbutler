<script lang="ts" module>
	export type DeleteBranchModalProps = {
		projectId: string;
		stackId?: string;
		branchName: string;
	};
</script>

<script lang="ts">
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal, TestId } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	const { projectId, branchName }: DeleteBranchModalProps = $props();
	const stackService = inject(STACK_SERVICE);
	const [removeBranch, branchRemovalOp] = stackService.branchRemove;

	let modal = $state<Modal>();

	export function show() {
		modal?.show();
	}
</script>

<Modal
	testId={TestId.BranchHeaderDeleteModal}
	bind:this={modal}
	width="small"
	title={$i18nMessages.t("desktop:DeleteBranchModal.deleteBranch")}
	onSubmit={async (close) => {
		const refName = [...new TextEncoder().encode(`refs/heads/${branchName}`)];
		await removeBranch({
			projectId,
			refName,
		});
		close();
	}}
>
	<p class="text-13 text-body">
		{#snippet i18nSlot1()}<code class="code-string">{branchName}</code>{/snippet}
		<I18nRichMessage
			value={{ key: "desktop:DeleteBranchModal.areYouSureYouWantToDelete" }}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>
	{#snippet controls(close)}
		<Button kind="outline" onclick={close} autofocus
			>{$i18nMessages.t("desktop:DeleteBranchModal.cancel")}</Button
		>
		<Button
			testId={TestId.BranchHeaderDeleteModal_ActionButton}
			style="danger"
			type="submit"
			loading={branchRemovalOp.current.isLoading}
			>{$i18nMessages.t("desktop:DeleteBranchModal.delete")}</Button
		>
	{/snippet}
</Modal>
