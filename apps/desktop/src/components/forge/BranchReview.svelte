<script lang="ts">
	import CanPublishReviewPlugin from "$components/forge/CanPublishReviewPlugin.svelte";
	import PullRequestCard from "$components/forge/PullRequestCard.svelte";
	import ReviewCreation from "$components/forge/ReviewCreation.svelte";
	import ReviewCreationControls from "$components/forge/ReviewCreationControls.svelte";
	import StackedPullRequestCard from "$components/forge/StackedPullRequestCard.svelte";
	import { FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import type { Segment } from "@gitbutler/but-sdk";
	import type { Snippet } from "svelte";
	const i18nMessages = useTranslations();

	// TODO: This and the SeriesHeader should have a wholistic refactor to
	// reduce the complexity of the forge related functionality.

	type Props = {
		branchStatus?: Snippet;
		projectId: string;
		stackId?: string;
		branchName: string;
		segment: Segment;
		branchIndex: number;
		parent: Segment | undefined;
		child: Segment | undefined;
		withForce: boolean;
		prNumber?: number;
		reviewId?: string;
	};

	const {
		branchStatus,
		projectId,
		stackId,
		branchName,
		segment,
		branchIndex,
		parent,
		child,
		withForce,
		prNumber,
		reviewId,
	}: Props = $props();

	let canPublishReviewPlugin = $state<ReturnType<typeof CanPublishReviewPlugin>>();

	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeInfo = $derived(forgeInfoQuery.response);
	const reviewUnit = $derived(forgeInfo?.unit.abbr);
	const reviewUnitName = $derived(
		$i18nMessages.t(
			forgeInfo?.unit.abbr === "MR" ? "desktop:review.mergeRequest" : "desktop:review.pullRequest",
		),
	);

	const canPublishPR = $derived(!!canPublishReviewPlugin?.imports.canPublishPR);

	let modal = $state<Modal>();
	let confirmCreatePrModal = $state<ReturnType<typeof Modal>>();
	let reviewCreation = $state<ReturnType<typeof ReviewCreation>>();
</script>

<CanPublishReviewPlugin
	bind:this={canPublishReviewPlugin}
	{projectId}
	commits={segment.commits}
	{prNumber}
	{reviewId}
/>

{#if stackId}
	<Modal
		width="small"
		type="warning"
		title={$i18nMessages.t("desktop:BranchReview.createValue", {
			reviewUnitName: String(reviewUnitName),
		})}
		bind:this={confirmCreatePrModal}
		onSubmit={() => {
			modal?.show();
		}}
	>
		<p class="text-13 text-body helper-text">
			{#snippet i18nSlot1()}<br />{/snippet}
			<I18nRichMessage
				value={{
					key: "desktop:BranchReview.itSStronglyRecommendedToCreateValueS",
					values: { value: String(reviewUnitName.toLowerCase()) },
				}}
				components={{ slot1: i18nSlot1 }}
			/>
		</p>
		{#snippet controls(close)}
			<Button kind="outline" onclick={close}
				>{$i18nMessages.t("desktop:BranchReview.cancel")}</Button
			>
			<Button style="warning" type="submit"
				>{$i18nMessages.t("desktop:BranchReview.createValue", {
					reviewUnitName: String(reviewUnitName),
				})}</Button
			>
		{/snippet}
	</Modal>

	<Modal bind:this={modal} title={$i18nMessages.t("desktop:BranchReview.submitChangesForReview")}>
		<ReviewCreation
			bind:this={reviewCreation}
			{projectId}
			{stackId}
			{branchName}
			{segment}
			{branchIndex}
			{parent}
			{withForce}
			onClose={() => modal?.close()}
		/>

		{#snippet controls(close)}
			<ReviewCreationControls
				isCreatingPR={!!reviewCreation?.imports.isLoading}
				isFormBusy={!!reviewCreation?.imports.isExecuting}
				{canPublishPR}
				{reviewUnit}
				onCancel={close}
				onSubmit={async () => {
					await reviewCreation?.createReview();
				}}
			/>
		{/snippet}
	</Modal>
{/if}

{#if prNumber || branchStatus}
	<div class="branch-action">
		{#if prNumber}
			<div class="status-cards">
				{#if prNumber && stackId}
					<StackedPullRequestCard
						{projectId}
						{stackId}
						{branchName}
						{parent}
						{child}
						isPushed={segment.pushStatus !== "completelyUnpushed"}
						{prNumber}
						poll
					/>
				{:else if prNumber}
					<PullRequestCard {projectId} {branchName} {prNumber} poll />
				{/if}
			</div>
		{/if}

		{#if branchStatus}
			{@render branchStatus()}
		{/if}
	</div>
{/if}

<style lang="postcss">
	.branch-action {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 14px;
	}

	.status-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;

		& :global(.review-card) {
			display: flex;
			position: relative;
			flex-direction: column;
			padding: 14px;
			gap: 12px;
			border: 1px solid var(--border-2);
			border-radius: var(--radius-m);
		}
	}
</style>
