<script lang="ts">
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import SettingsSection from "$components/shared/SettingsSection.svelte";
	import { projectRunCommitHooks } from "$lib/config/config";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Toggle } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import type { Project } from "$lib/project/project";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId: string } = $props();
	const runCommitHooks = $derived(projectRunCommitHooks(projectId));
	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId));

	async function onHuskyHooksEnabledClick(project: Project, value: boolean) {
		await projectsService.updateProject({ ...project, husky_hooks_enabled: value });
	}
</script>

<SettingsSection>
	<CardGroup>
		<CardGroup.Item labelFor="runHooks">
			{#snippet title()}
				{$i18nMessages.t("desktop:GitHooksForm.runGitHooks")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:GitHooksForm.enableRunningGitHooksPrePushPrePost")}
			{/snippet}
			{#snippet actions()}
				<Toggle id="runHooks" bind:checked={$runCommitHooks} />
			{/snippet}
		</CardGroup.Item>
	</CardGroup>

	<ReduxResult {projectId} result={projectQuery.result}>
		{#snippet children(project)}
			<CardGroup>
				<CardGroup.Item labelFor="huskyHooks">
					{#snippet title()}
						{$i18nMessages.t("desktop:GitHooksForm.enableHuskyHooks")}
					{/snippet}
					{#snippet caption()}
						{#snippet i18nSlot1()}<br />{/snippet}
						<I18nRichMessage
							value={{ key: "desktop:GitHooksForm.onlyEnableThisForRepositoriesYouTrustAllow" }}
							components={{ slot1: i18nSlot1 }}
						/>
					{/snippet}
					{#snippet actions()}
						<Toggle
							id="huskyHooks"
							checked={project.husky_hooks_enabled}
							onchange={(checked) => onHuskyHooksEnabledClick(project, checked)}
						/>
					{/snippet}
				</CardGroup.Item>
			</CardGroup>
		{/snippet}
	</ReduxResult>
</SettingsSection>
