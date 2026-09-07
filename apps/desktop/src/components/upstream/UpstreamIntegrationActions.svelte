<script lang="ts">
	import BranchIntegrationModal from "$components/branch/BranchIntegrationModal.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal, TestId } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		branchRef: string;
		branchName: string;
	};

	const { projectId, branchRef, branchName }: Props = $props();

	let integrationModal = $state<Modal>();

	function kickOffIntegration() {
		integrationModal?.show();
	}
</script>

<BranchIntegrationModal bind:modalRef={integrationModal} {projectId} {branchRef} {branchName} />

<div class="upstream-integration-actions">
	<p class="text-12 text-body clr-text-2">
		{#snippet i18nSlot1()}<br />{/snippet}
		<I18nRichMessage
			value={{ key: "desktop:UpstreamIntegrationActions.thisBranchAndItsRemoteHaveDivergedUpdate" }}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>
	<Button
		style="warning"
		testId={TestId.UpstreamCommitsIntegrateButton}
		onclick={kickOffIntegration}
	>
		{$i18nMessages.t("desktop:UpstreamIntegrationActions.updateLocalBranch")}
	</Button>
</div>

<style lang="postcss">
	.upstream-integration-actions {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
</style>
