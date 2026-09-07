<script lang="ts">
	import CommitSigningForm from "$components/projectSettings/CommitSigningForm.svelte";
	import GitHooksForm from "$components/projectSettings/GitHooksForm.svelte";
	import KeysForm from "$components/projectSettings/KeysForm.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import SettingsSection from "$components/shared/SettingsSection.svelte";
	import { BACKEND } from "$lib/backend";
	import { projectLandDirectly } from "$lib/config/config";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Spacer, Toggle } from "@gitbutler/ui";
	import type { Project } from "$lib/project/project";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId: string } = $props();
	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId));
	const backend = inject(BACKEND);
	const landDirectly = $derived(projectLandDirectly(projectId));

	async function onForcePushProtectionClick(project: Project, value: boolean) {
		await projectsService.updateProject({ ...project, force_push_protection: value });
	}
</script>

<SettingsSection>
	<CardGroup>
		<CardGroup.Item labelFor="landDirectly">
			{#snippet title()}
				{$i18nMessages.t("desktop:GitForm.landBranchesDirectly")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:GitForm.replaceTheCreatePRButtonWithALand")}
			{/snippet}
			{#snippet actions()}
				<Toggle id="landDirectly" bind:checked={$landDirectly} />
			{/snippet}
		</CardGroup.Item>
	</CardGroup>

	<GitHooksForm {projectId} />
	<CommitSigningForm {projectId} />
	{#if backend.platformName !== "windows"}
		<Spacer />
		<KeysForm {projectId} showProjectName={false} />
	{/if}

	<Spacer />
	<ReduxResult {projectId} result={projectQuery.result}>
		{#snippet children(project)}
			<CardGroup>
				<CardGroup.Item labelFor="forcePushProtection">
					{#snippet title()}
						{$i18nMessages.t("desktop:GitForm.forcePushProtection")}
					{/snippet}
					{#snippet caption()}
						{$i18nMessages.t("desktop:GitForm.protectRemoteCommitsDuringForcePushesThisWill")}
					{/snippet}
					{#snippet actions()}
						<Toggle
							id="forcePushProtection"
							checked={project.force_push_protection}
							onchange={(checked) => onForcePushProtectionClick(project, checked)}
						/>
					{/snippet}
				</CardGroup.Item>
			</CardGroup>
		{/snippet}
	</ReduxResult>
</SettingsSection>
