<script lang="ts">
	import { goto } from "$app/navigation";
	import WelcomeAction from "$components/onboarding/WelcomeAction.svelte";

	import IconLink from "$components/shared/IconLink.svelte";
	import cloneRepoSvg from "$lib/assets/welcome/clone-repo.svg?raw";
	import newProjectSvg from "$lib/assets/welcome/new-local-project.svg?raw";
	import { showError } from "$lib/error/showError";
	import { LANGUAGE_SERVICE } from "$lib/i18n";
	import { handleAddProjectOutcome } from "$lib/project/project";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";

	import { inject } from "@gitbutler/core/context";
	import { message } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { TestId } from "@gitbutler/ui";
	import LanguageSelect from "@gitbutler/ui/i18n/LanguageSelect.svelte";
	const i18nMessages = useTranslations();

	const projectsService = inject(PROJECTS_SERVICE);
	const language = inject(LANGUAGE_SERVICE);
	const appSettings = inject(SETTINGS_SERVICE).appSettings;

	const serverCapabilitiesQuery = $derived(projectsService.serverCapabilities());
	const canAddProjects = $derived(serverCapabilitiesQuery.response?.canAddProjects ?? true);

	let newProjectLoading = $state(false);
	let directoryInputElement = $state<HTMLInputElement | undefined>();

	async function onNewProject() {
		newProjectLoading = true;
		try {
			const testDirectoryPath = directoryInputElement?.value;
			const outcome = await projectsService.addProject(testDirectoryPath ?? "");

			if (outcome) {
				handleAddProjectOutcome(outcome);
			}
		} catch (e: unknown) {
			showError(message("desktop:Welcome.unableToAddProject"), e);
		} finally {
			newProjectLoading = false;
		}
	}

	async function onCloneProject() {
		goto("/onboarding/clone");
	}
</script>

<div class="welcome" data-testid={TestId.WelcomePage}>
	<h1 class="welcome-title text-serif-42">
		{$i18nMessages.t("desktop:Welcome.welcomeToGitButler")}
	</h1>
	<div class="welcome__language">
		<LanguageSelect
			value={$appSettings?.ui.language ?? "system"}
			onchange={(value) => language.set(value)}
		/>
	</div>
	<div class="welcome__actions">
		<div class="welcome__actions--repo">
			<input
				type="text"
				hidden
				bind:this={directoryInputElement}
				data-testid="test-directory-path"
			/>
			{#if canAddProjects}
				<WelcomeAction
					title={$i18nMessages.t("desktop:Welcome.addLocalProject")}
					loading={newProjectLoading}
					onclick={onNewProject}
					dimMessage
					testId={TestId.WelcomePageAddLocalProjectButton}
				>
					{#snippet icon()}
						{@html newProjectSvg}
					{/snippet}
					{#snippet message()}
						{$i18nMessages.t("desktop:Welcome.shouldBeAValidGitRepository")}
					{/snippet}
				</WelcomeAction>
			{/if}
			<WelcomeAction
				title={$i18nMessages.t("desktop:Welcome.cloneRepository")}
				onclick={onCloneProject}
				dimMessage
			>
				{#snippet icon()}
					{@html cloneRepoSvg}
				{/snippet}
				{#snippet message()}
					{$i18nMessages.t("desktop:Welcome.cloneARepoUsingAURL")}
				{/snippet}
			</WelcomeAction>
		</div>
		<!-- Using instance of user here to not hide after login -->
	</div>

	<div class="links">
		<div class="links__section">
			<p class="links__title text-14 text-bold">{$i18nMessages.t("desktop:Welcome.quickStart")}</p>
			<div class="education-links">
				<IconLink
					icon="docs"
					href="https://docs.gitbutler.com/features/virtual-branches/branch-lanes"
				>
					{$i18nMessages.t("desktop:Welcome.gitButlerDocs")}
				</IconLink>
				<IconLink icon="youtube" href="https://www.youtube.com/@gitbutlerapp">
					{$i18nMessages.t("desktop:Welcome.watchTutorials")}
				</IconLink>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.welcome {
		width: 100%;
	}

	.welcome-title {
		color: var(--text-1);
		line-height: 1;
	}

	.welcome__language {
		margin-top: 20px;
	}

	.welcome__actions {
		display: flex;
		flex-direction: column;
		margin-top: 32px;
		gap: 8px;
	}

	.welcome__actions--repo {
		display: flex;
		gap: 8px;
	}

	.links {
		display: flex;
		margin-top: 20px;
		padding: 28px;
		gap: 56px;
		border-radius: var(--radius-m);
		background: var(--bg-mute);
	}

	.links__section {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.education-links {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		margin-left: -6px;
		gap: 6px;
	}

	/* SMALL ILLUSTRATIONS */
</style>
