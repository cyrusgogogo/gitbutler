<script lang="ts">
	import { goto } from "$app/navigation";
	import { handleAddProjectOutcome } from "$lib/project/project";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { projectPath } from "$lib/routes/routes.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, OptionsGroup, Select, SelectItem } from "@gitbutler/ui";
	import { untrack } from "svelte";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId?: string } = $props();

	const projectsService = inject(PROJECTS_SERVICE);
	const projectsQuery = $derived(projectsService.projects());
	const serverCapabilitiesQuery = $derived(projectsService.serverCapabilities());
	const canAddProjects = $derived(serverCapabilitiesQuery.response?.canAddProjects ?? true);

	let selectedId = $state<string | undefined>(untrack(() => projectId));

	const mappedProjects = $derived(
		projectsQuery.response?.map((project) => ({
			value: project.id,
			label: project.title,
		})) || [],
	);

	let newProjectLoading = $state(false);
	let cloneProjectLoading = $state(false);
</script>

<div class="project-switcher">
	<Select
		value={selectedId}
		options={mappedProjects}
		label={$i18nMessages.t("desktop:ProjectSwitcher.switchToAnotherProject")}
		wide
		onselect={(value) => {
			selectedId = value;
		}}
		searchable
	>
		{#snippet itemSnippet({ item, highlighted })}
			<SelectItem selected={item.value === selectedId} {highlighted}>
				{item.label}
			</SelectItem>
		{/snippet}

		<OptionsGroup>
			{#if canAddProjects}
				<SelectItem
					icon="plus"
					loading={newProjectLoading}
					onClick={async () => {
						newProjectLoading = true;
						try {
							const outcome = await projectsService.addProject();
							if (!outcome) {
								// User cancelled the project creation
								newProjectLoading = false;
								return;
							}
							handleAddProjectOutcome(outcome, (project) => goto(projectPath(project.id)));
						} finally {
							newProjectLoading = false;
						}
					}}
				>
					{$i18nMessages.t("desktop:ProjectSwitcher.addLocalRepository")}
				</SelectItem>
			{/if}
			<SelectItem
				icon="clone"
				loading={cloneProjectLoading}
				onClick={async () => {
					cloneProjectLoading = true;
					try {
						goto("/onboarding/clone");
					} finally {
						cloneProjectLoading = false;
					}
				}}
			>
				{$i18nMessages.t("desktop:ProjectSwitcher.cloneRepository")}
			</SelectItem>
		</OptionsGroup>
	</Select>

	<Button
		style="pop"
		icon="chevron-right"
		disabled={selectedId === projectId}
		onclick={() => {
			if (selectedId) goto(projectPath(selectedId));
		}}
	>
		{$i18nMessages.t("desktop:ProjectSwitcher.openProject")}
	</Button>
</div>

<style lang="postcss">
	.project-switcher {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
	}
</style>
