<script lang="ts">
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Link, Toggle } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
	};

	const { projectId }: Props = $props();

	const gbConfig = inject(GIT_CONFIG_SERVICE);
	const projectService = inject(PROJECTS_SERVICE);

	const isGerritProject = $derived(projectService.isGerritProject(projectId));
</script>

<div class="stack-v">
	<ReduxResult {projectId} result={isGerritProject.result}>
		{#snippet children(itIsAGerritProject)}
			<CardGroup.Item standalone labelFor="gerritModeToggle">
				{#snippet title()}
					{$i18nMessages.t("desktop:GerritForm.gerritConfiguration")}
				{/snippet}

				{#snippet caption()}
					{$i18nMessages.t("desktop:GerritForm.enableOrDisableGerritModeForThisProject")}
					<Link href="https://docs.gitbutler.com/features/gerrit-mode"
						>{$i18nMessages.t("desktop:GerritForm.learnMore")}</Link
					>
				{/snippet}

				{#snippet actions()}
					<Toggle
						id="gerritModeToggle"
						checked={itIsAGerritProject}
						onclick={() => gbConfig.setGerritMode(projectId, !itIsAGerritProject)}
					/>
				{/snippet}
			</CardGroup.Item>
		{/snippet}
	</ReduxResult>
</div>
