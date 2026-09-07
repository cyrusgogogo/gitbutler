<script lang="ts">
	import { goto } from "$app/navigation";
	import RemoveProjectButton from "$components/projectSettings/RemoveProjectButton.svelte";
	import IllustrationSplitLayout from "$components/shared/IllustrationSplitLayout.svelte";
	import ProjectSwitcher from "$components/shared/ProjectSwitcher.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import notFoundSvg from "$lib/assets/illustrations/not-found.svg?raw";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, InfoMessage, type MessageStyle, Spacer, TestId } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	interface Props {
		projectId: string;
	}
	const { projectId }: Props = $props();

	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId, true));

	let deleteSucceeded: boolean | undefined = $state(undefined);
	let isDeleting = $state(false);

	async function stopTracking(id: string) {
		isDeleting = true;
		deleteProject: {
			try {
				await projectsService.deleteProject(id);
			} catch {
				deleteSucceeded = false;
				break deleteProject;
			}
			deleteSucceeded = true;
		}
		isDeleting = false;
		goto("/");
	}

	async function locate(id: string) {
		await projectsService.relocateProject(id);
	}

	interface DeletionStatus {
		message: LocalizedText;
		style: MessageStyle;
	}

	function getDeletionStatus(repoName: string, deleteSucceeded: boolean): DeletionStatus {
		return deleteSucceeded
			? { message: i18nMessage("desktop:project.removed", { name: repoName }), style: "success" }
			: {
					message: i18nMessage("desktop:project.removeFailed", { name: repoName }),
					style: "danger",
				};
	}
</script>

<IllustrationSplitLayout testId={TestId.ProjectNotFoundPage} img={notFoundSvg}>
	<div class="container">
		<ReduxResult {projectId} result={projectQuery.result}>
			{#snippet children(project)}
				{#if deleteSucceeded === undefined}
					<div class="text-content">
						<h2 class="title-text text-18 text-body text-bold">
							{$i18nMessages.t("desktop:ProjectNotFound.canTFindValue", {
								title: String(project.title),
							})}
						</h2>

						<p class="description-text text-13 text-body">
							{#snippet i18nSlot1()}<br />{/snippet}
							<I18nRichMessage
								value={{ key: "desktop:ProjectNotFound.sorryWeCanTFindTheProjectYou" }}
								components={{ slot1: i18nSlot1 }}
							/>
							<button type="button" class="check-again-btn" onclick={() => location.reload()}
								>{$i18nMessages.t("desktop:ProjectNotFound.clickHere")}</button
							>
							{#snippet i18nSlot2()}<br />{/snippet}
							{#snippet i18nSlot3(content: import("svelte").Snippet)}<span class="code-string"
									>{@render content()}</span
								>{/snippet}
							<I18nRichMessage
								value={{
									key: "desktop:ProjectNotFound.toCheckAgainTheCurrentProjectPathValue",
									values: { path: String(project.path) },
								}}
								components={{ slot2: i18nSlot2, slot3: i18nSlot3 }}
							/>
						</p>
					</div>

					<div class="button-container">
						<Button type="button" style="pop" onclick={async () => await locate(projectId)}
							>{$i18nMessages.t("desktop:ProjectNotFound.locateProject")}</Button
						>
						<RemoveProjectButton
							noModal
							{isDeleting}
							onDeleteClicked={async () => await stopTracking(project.id)}
						/>
					</div>
				{/if}

				{#if deleteSucceeded !== undefined}
					{@const deletionStatus = getDeletionStatus(project.title, deleteSucceeded)}
					<InfoMessage filled outlined={false} style={deletionStatus.style} icon="info">
						{#snippet content()}
							{$i18nMessages.text(deletionStatus.message)}
						{/snippet}
					</InfoMessage>
				{/if}
			{/snippet}
		</ReduxResult>

		<Spacer dotted margin={0} />
		<ProjectSwitcher {projectId} />
	</div>
</IllustrationSplitLayout>

<style lang="postcss">
	.container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.button-container {
		display: flex;
		gap: 8px;
	}

	.text-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.title-text {
		color: var(--text-1);
	}

	.description-text {
		color: var(--text-2);
		line-height: 1.6;
	}

	.check-again-btn {
		text-decoration: underline;
	}
</style>
