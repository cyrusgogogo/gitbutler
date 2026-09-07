<script lang="ts">
	import BranchCommitsRow from "$lib/components/changes/BranchCommitsRow.svelte";
	import Table from "$lib/components/table/Table.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { type Branch } from "@gitbutler/shared/branches/types";
	import { type ProjectReviewParameters } from "@gitbutler/shared/routing/webRoutes.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		data: ProjectReviewParameters;
		branch: Branch;
	};

	const { data, branch }: Props = $props();
</script>

<table class="commits-table">
	<Table
		headColumns={[
			{ key: "position", value: "" },
			{ key: "status", value: $i18nMessages.t("web:BranchCommitsTable.inlinebae7d5be7") },
			{ key: "version", value: $i18nMessages.t("web:BranchCommitsTable.inlinead13edd94") },
			{ key: "string", value: $i18nMessages.t("web:BranchCommitsTable.inline709a23220") },
			{ key: "changes", value: $i18nMessages.t("web:BranchCommitsTable.changes") },
			{ key: "date", value: $i18nMessages.t("web:BranchCommitsTable.updated") },
			{ key: "avatars", value: $i18nMessages.t("web:BranchCommitsTable.inlined2a52548b") },
			{ key: "reviewers", value: $i18nMessages.t("web:BranchCommitsTable.reviewers") },
			{ key: "comments", value: "" },
		]}
	>
		{#snippet body()}
			{#each branch.patchCommitIds || [] as changeId, index}
				<BranchCommitsRow
					{changeId}
					params={data}
					branchUuid={branch.uuid}
					last={index === branch.patchCommitIds.length - 1}
				/>
			{/each}
		{/snippet}
	</Table>
</table>

<style lang="postcss">
</style>
