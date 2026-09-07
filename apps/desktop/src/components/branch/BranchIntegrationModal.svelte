<script lang="ts">
	import BranchIntegrationModalContent from "$components/branch/BranchIntegrationModalContent.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Modal, TestId } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	type Props = {
		modalRef: Modal | undefined;
		projectId: string;
		branchRef: string;
		branchName: string;
	};

	let { modalRef = $bindable(), projectId, branchRef, branchName }: Props = $props();
</script>

<Modal
	bind:this={modalRef}
	title={$i18nMessages.t("desktop:BranchIntegrationModal.updateLocalBranch")}
	noPadding
	width={720}
	testId={TestId.BranchIntegrationModal}
>
	<BranchIntegrationModalContent
		{projectId}
		{branchRef}
		{branchName}
		closeModal={() => modalRef?.close()}
	/>
</Modal>
