<script lang="ts">
	import { goto } from "$app/navigation";
	import SettingsSection from "$components/shared/SettingsSection.svelte";
	import { BACKEND } from "$lib/backend";
	import { parseError } from "$lib/error/parser";
	import { GIT_SERVICE } from "$lib/git/gitService";
	import { parseRemoteUrl } from "$lib/git/gitUrl";
	import { handleAddProjectOutcome } from "$lib/project/project";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { projectPath } from "$lib/routes/routes.svelte";

	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { persisted } from "@gitbutler/shared/persisted";
	import { Button, InfoMessage, type MessageStyle, Spacer, Textbox } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { onMount } from "svelte";
	const i18nMessages = useTranslations();

	const projectsService = inject(PROJECTS_SERVICE);
	const gitService = inject(GIT_SERVICE);

	const backend = inject(BACKEND);

	let loading = $state(false);
	let errors = $state<{ label: string }[]>([]);
	let completed = $state(false);
	let repositoryUrl = $state("");
	let targetDirPath = $state("");
	let savedTargetDirPath = persisted("", "clone_targetDirPath");

	onMount(async () => {
		if ($savedTargetDirPath) {
			targetDirPath = $savedTargetDirPath;
		} else {
			targetDirPath = await backend.documentDir();
		}
	});

	async function handleCloneTargetSelect() {
		const selectedPath = await backend.filePicker({
			directory: true,
			recursive: true,
			title: $i18nMessages.t("desktop:CloneForm.targetCloneDirectory"),
		});
		if (!selectedPath || !selectedPath[0]) return;

		targetDirPath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
	}

	function getErrorMessage(error: unknown): string {
		const parsedError = parseError(error);
		if (parsedError.name && parsedError.name !== parsedError.message) {
			return `${parsedError.name}: ${parsedError.message}`;
		}
		return parsedError.message;
	}

	async function cloneRepository() {
		loading = true;
		savedTargetDirPath.set(targetDirPath);
		if (errors.length) {
			errors = [];
		}

		if (!repositoryUrl || !targetDirPath) {
			errors.push({
				label: $i18nMessages.t("desktop:CloneForm.youMustAddBothARepositoryURLAnd"),
			});
			loading = false;
			return;
		}

		try {
			const remoteUrl = parseRemoteUrl(repositoryUrl);
			if (!remoteUrl) {
				return;
			}

			const targetDir = await backend.joinPath(targetDirPath, remoteUrl.name);

			await gitService.cloneRepo(repositoryUrl, targetDir);

			const outcome = await projectsService.addProject(targetDir);
			if (!outcome) {
				throw new Error("Failed to add project after cloning.");
			}

			handleAddProjectOutcome(outcome, (project) => goto(projectPath(project.id)));
		} catch (e) {
			const errorMessage = getErrorMessage(e);

			errors.push({
				label: errorMessage,
			});
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		if (history.length > 0) {
			history.back();
		} else {
			goto("/");
		}
	}
</script>

<h1 class="clone-title text-serif-42">
	{#snippet i18nSlot1(content: import("svelte").Snippet)}<i>{@render content()}</i>{/snippet}
	<I18nRichMessage
		value={{ key: "desktop:CloneForm.cloneARepository" }}
		components={{ slot1: i18nSlot1 }}
	/>
</h1>
<SettingsSection>
	<Textbox label={$i18nMessages.t("desktop:CloneForm.cloneURL")} bind:value={repositoryUrl} />

	<div class="clone__field repositoryTargetPath">
		<Textbox
			label={$i18nMessages.t("desktop:CloneForm.whereToClone")}
			bind:value={targetDirPath}
			placeholder={$i18nMessages.t("desktop:CloneForm.usersTipsyDocuments")}
		/>
		<Button kind="outline" disabled={loading} onclick={handleCloneTargetSelect}
			>{$i18nMessages.t("desktop:CloneForm.choose")}</Button
		>
	</div>
</SettingsSection>

<Spacer dotted margin={24} />

{#if completed}
	{@render Notification({ title: $i18nMessages.t("desktop:CloneForm.success"), style: "success" })}
{/if}
{#if errors.length}
	{@render Notification({
		title: $i18nMessages.t("desktop:CloneForm.error"),
		items: errors,
		style: "danger",
	})}
{/if}

<div class="clone__actions">
	<Button kind="outline" disabled={loading} onclick={handleCancel}
		>{$i18nMessages.t("desktop:CloneForm.cancel")}</Button
	>
	<Button
		style="pop"
		icon={errors.length > 0 ? "refresh" : "chevron-right"}
		disabled={loading}
		{loading}
		onclick={cloneRepository}
	>
		{#if loading}
			{$i18nMessages.t("desktop:CloneForm.cloning")}
		{:else if errors.length > 0}
			{$i18nMessages.t("desktop:CloneForm.retryClone")}
		{:else}
			{$i18nMessages.t("desktop:CloneForm.clone")}
		{/if}
	</Button>
</div>

{#snippet Notification({
	title: titleLabel,
	items,
	style,
}: {
	title: string;
	items?: any[];
	style: MessageStyle;
})}
	<div class="clone__info-message">
		<InfoMessage {style} filled outlined={false}>
			{#snippet title()}
				{titleLabel}
			{/snippet}
			{#snippet content()}
				{#if items && items.length > 0}
					{#each items as item}
						<span>{item.label}</span>
					{/each}
				{/if}
			{/snippet}
		</InfoMessage>
	</div>
{/snippet}

<style>
	.clone-title {
		margin-bottom: 20px;
		color: var(--text-1);
		line-height: 1;
	}

	.clone__field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.clone__actions {
		display: flex;
		justify-content: end;
		gap: 8px;
	}

	.clone__info-message {
		margin-bottom: 20px;
	}
</style>
