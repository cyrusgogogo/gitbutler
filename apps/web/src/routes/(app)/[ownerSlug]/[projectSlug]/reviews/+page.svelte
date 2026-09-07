<script lang="ts">
	import { goto } from "$app/navigation";
	import BranchIndexCard from "$lib/components/branches/BranchIndexCard.svelte";
	import DashboardLayout from "$lib/components/dashboard/DashboardLayout.svelte";
	import Table from "$lib/components/table/Table.svelte";
	import { USER_SERVICE } from "$lib/user/userService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { getBranchReviewsForRepository } from "@gitbutler/shared/branches/branchesPreview.svelte";
	import { BranchStatus } from "@gitbutler/shared/branches/types";
	import Loading from "@gitbutler/shared/network/Loading.svelte";
	import { getProject } from "@gitbutler/shared/organizations/projectsPreview.svelte";
	import { type ProjectParameters } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button, Select, SelectItem } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	// Get authentication service and check if user is logged in
	const routes = inject(WEB_ROUTES_SERVICE);
	const userService = inject(USER_SERVICE);
	const user = userService.user;

	// If there is no user (user not logged in), redirect to home
	$effect(() => {
		if ($user === undefined) {
			goto(routes.homePath());
		}
	});

	interface Props {
		data: ProjectParameters;
	}

	let { data }: Props = $props();

	let filterStatus = $state<BranchStatus>(BranchStatus.All);
	const selectableStatuses = $derived([
		{ value: BranchStatus.All, label: $i18nMessages.t("web:page.allBranches") },
		{ value: BranchStatus.Closed, label: $i18nMessages.t("web:page.closed") },
		{ value: BranchStatus.Active, label: $i18nMessages.t("web:page.active") },
		{ value: BranchStatus.Inactive, label: $i18nMessages.t("web:page.inactive") },
	]);

	const brancheses = $derived(
		getBranchReviewsForRepository(data.ownerSlug, data.projectSlug, filterStatus),
	);

	const project = $derived(getProject(data.ownerSlug, data.projectSlug));
</script>

<svelte:head>
	<title
		>{$i18nMessages.t("web:page.reviewValueValue", {
			ownerSlug: String(data.ownerSlug),
			projectSlug: String(data.projectSlug),
		})}</title
	>
</svelte:head>

{#snippet filters()}
	<Select
		options={selectableStatuses}
		value={filterStatus}
		autoWidth
		onselect={(value) => {
			filterStatus = value as BranchStatus;
		}}
	>
		{#snippet customSelectButton()}
			<Button kind="ghost" icon="chevron-down">
				{selectableStatuses.find((status) => status.value === filterStatus)!.label}
			</Button>
		{/snippet}
		{#snippet itemSnippet({ item, highlighted })}
			<SelectItem {highlighted}>{item.label}</SelectItem>
		{/snippet}
	</Select>
{/snippet}

<DashboardLayout>
	<Loading loadable={brancheses?.current}>
		{#snippet children(brancheses)}
			<div class="header">
				<div class="title">
					<Loading loadable={project.current}>
						{#snippet children(project)}
							<div class="text-16 text-bold">{project.name}</div>
						{/snippet}
					</Loading>
				</div>
				{@render filters()}
			</div>

			{#if brancheses.length === 0}
				<div class="empty-state">
					<h3>{$i18nMessages.t("web:page.noBranchesFound")}</h3>
					<p>{$i18nMessages.t("web:page.thereAreNoBranchesMatchingYourCurrentFilter")}</p>
				</div>
			{:else}
				<Table
					headColumns={[
						{
							key: "status",
							value: $i18nMessages.t("web:page.inlinebae7d5be7"),
						},
						{
							key: "title",
							value: $i18nMessages.t("web:page.inline709a23220"),
						},
						{
							key: "number",
							value: "UUID",
						},
						{
							key: "number",
							value: $i18nMessages.t("web:page.inline74536b517"),
						},
						{
							key: "date",
							value: $i18nMessages.t("web:page.inlinefb91e24fa"),
						},
						{
							key: "avatars",
							value: $i18nMessages.t("web:page.inlined2a52548b"),
						},
						{
							key: "number",
							value: $i18nMessages.t("web:page.inlinead13edd94"),
							tooltip: $i18nMessages.t("web:page.inline4d24a1d8a"),
						},
					]}
				>
					{#snippet body()}
						{#each brancheses as branches, i}
							{#each branches as branch, j}
								<BranchIndexCard
									linkParams={data}
									uuid={branch.uuid}
									isTopEntry={i + j === 0}
									roundedTop={j === 0 && i !== 0}
									roundedBottom={j === branches.length - 1}
								/>
							{/each}
						{/each}
					{/snippet}
				</Table>
			{/if}
		{/snippet}
	</Loading>
</DashboardLayout>

<style>
	.header {
		display: flex;
		align-items: center;

		justify-content: space-between;

		margin-top: 8px;
		margin-bottom: 16px;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 64px 0;
		border: 1px solid #ddd;
		border-radius: 12px;
		background-color: #fff;
		text-align: center;
	}

	.empty-state h3 {
		margin: 16px 0 8px;
		font-weight: 600;
		font-size: 18px;
	}

	.empty-state p {
		margin: 0 0 24px;
		color: var(--color-text-secondary);
	}
</style>
