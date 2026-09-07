<script lang="ts">
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Spacer, Textarea, Textbox } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId: string } = $props();

	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId));
</script>

<CardGroup>
	<ReduxResult {projectId} result={projectQuery.result}>
		{#snippet children(project)}
			<div class="fields-wrapper">
				<Textbox
					label={$i18nMessages.t("desktop:DetailsForm.projectPath")}
					readonly
					id="path"
					value={project?.path}
				/>
				<div class="description-wrapper">
					<Textbox
						label={$i18nMessages.t("desktop:DetailsForm.projectName")}
						id="name"
						placeholder={$i18nMessages.t("desktop:DetailsForm.projectNameCanTBeEmpty")}
						value={project.title}
						required
						onchange={(value: string) => {
							projectsService.updateProject({ ...project, title: value });
						}}
					/>
					<Textarea
						id="description"
						minRows={3}
						maxRows={6}
						placeholder={$i18nMessages.t("desktop:DetailsForm.projectDescription")}
						value={project.description}
						oninput={(e: Event) => {
							const target = e.currentTarget as HTMLTextAreaElement;
							projectsService.updateProject({ ...project, description: target.value });
						}}
					/>
				</div>
			</div>
		{/snippet}
	</ReduxResult>
</CardGroup>

<Spacer />

<style>
	.fields-wrapper {
		display: flex;
		flex-direction: column;
		padding: 16px;
		gap: 16px;
	}

	.description-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
