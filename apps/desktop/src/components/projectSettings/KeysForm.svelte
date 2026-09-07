<script lang="ts">
	import CredentialCheck from "$components/projectSettings/CredentialCheck.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { BASE_BRANCH_SERVICE } from "$lib/baseBranch/baseBranchService.svelte";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		// Used by credential checker before target branch set
		projectId: string;
		remoteName?: string;
		branchName?: string;
		showProjectName?: boolean;
		disabled?: boolean;
	}

	const { projectId, remoteName = "", branchName = "", disabled = false }: Props = $props();

	const baseBranchService = inject(BASE_BRANCH_SERVICE);
	const baseBranchQuery = $derived(baseBranchService.baseBranch(projectId));
	const baseBranch = $derived(baseBranchQuery.response);
	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId));
</script>

<ReduxResult {projectId} result={projectQuery.result}>
	{#snippet children(project)}
		<CardGroup>
			<CardGroup.Item>
				{#snippet title()}
					{$i18nMessages.t("desktop:KeysForm.gitAuthentication")}
				{/snippet}
				{#snippet caption()}
					{$i18nMessages.t(
						"desktop:KeysForm.gitButlerAuthenticatesWithYourGitRemoteProviderThrough",
					)}
				{/snippet}
				<CredentialCheck
					{disabled}
					projectId={project.id}
					remoteName={remoteName || baseBranch?.remoteName}
					branchName={branchName || baseBranch?.shortName}
				/>
			</CardGroup.Item>
		</CardGroup>
	{/snippet}
</ReduxResult>
