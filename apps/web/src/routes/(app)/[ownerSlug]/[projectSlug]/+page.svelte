<script lang="ts">
	import { goto } from "$app/navigation";
	import ProjectConnectModal from "$lib/components/ProjectConnectModal.svelte";
	import ReviewsSection from "$lib/components/ReviewsSection.svelte";
	import { featureShowProjectPage } from "$lib/featureFlags";
	import { getTimeSince } from "$lib/utils/dateUtils";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import PermissionsSelector from "@gitbutler/shared/organizations/PermissionsSelector.svelte";
	import { PROJECT_SERVICE } from "@gitbutler/shared/organizations/projectService";
	import {
		WEB_ROUTES_SERVICE,
		type ProjectParameters,
	} from "@gitbutler/shared/routing/webRoutes.svelte";
	import { AsyncButton, Button, Markdown, Modal, chipToasts } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { untrack } from "svelte";
	const i18nMessages = useTranslations();

	interface Props {
		data: ProjectParameters;
	}

	let { data }: Props = $props();
	const projectService = inject(PROJECT_SERVICE);
	const routes = inject(WEB_ROUTES_SERVICE);

	$effect(() => {
		if (!$featureShowProjectPage) {
			goto(routes.homePath());
		}
	});

	// Store project data in a reactive variable
	let projectData = $state<any>(null);

	// Create a promise for the project data
	const projectSlug = untrack(() => `${data.ownerSlug}/${data.projectSlug}`);
	const projectPromise = projectService.getProjectBySlug(projectSlug).then((result) => {
		if (result) {
			projectData = result;
		}
		return result;
	});

	// Create a promise for the patch stacks data
	let patchStacksData = $state<any[]>([]);
	const patchStacksPromise = projectService.getProjectPatchStacks(projectSlug).then((result) => {
		if (result) {
			patchStacksData = result;
		}
		return result;
	});

	// Start editing the README
	function startEditingReadme(currentReadme: string | undefined) {
		readmeContent = currentReadme || "";
		editingReadme = true;
	}

	// Cancel editing the README
	function cancelEditingReadme() {
		editingReadme = false;
	}

	// Save the README
	async function saveReadme(repositoryId: string) {
		try {
			isSavingReadme = true;
			// Use a type assertion since readme isn't part of UpdateParams
			await projectService.updateProject(repositoryId, { readme: readmeContent } as any);

			// Update the local project data with the new README
			projectData = {
				...projectData,
				readme: readmeContent,
			};

			editingReadme = false;
			chipToasts.success(i18nMessage("web:page.rEADMEUpdatedSuccessfully"));
		} catch (error) {
			chipToasts.error(
				i18nMessage("web:page.failedToUpdateREADMEValue", {
					value: error instanceof Error ? error.message : i18nMessage("common:unknownError"),
				}),
			);
		} finally {
			isSavingReadme = false;
		}
	}

	// README editing state
	let editingReadme = $state(false);
	let readmeContent = $state("");
	let isSavingReadme = $state(false);

	// Project edit state and modal reference
	let editProjectModal = $state<ReturnType<typeof Modal> | undefined>(undefined);
	let editedName = $state("");
	let editedSlug = $state("");
	let editedDescription = $state("");
	let isUpdatingProject = $state(false);

	// Open edit project modal
	function openEditProjectModal() {
		editedName = projectData.name || "";
		editedSlug = projectData.slug || "";
		editedDescription = projectData.description || "";
		editProjectModal?.show();
	}

	// Save project edits
	async function saveProjectEdits(repositoryId: string) {
		try {
			isUpdatingProject = true;

			const updateParams = {
				name: editedName,
				slug: editedSlug,
				description: editedDescription,
			};

			const updatedProject = await projectService.updateProject(repositoryId, updateParams);

			// Update the local project data
			projectData = {
				...projectData,
				...updatedProject,
			};

			editProjectModal?.close();
			chipToasts.success(i18nMessage("web:page.projectUpdatedSuccessfully"));

			// If the slug changed, redirect to the new URL
			if (editedSlug !== data.projectSlug) {
				goto(
					routes.projectPath({
						ownerSlug: data.ownerSlug,
						projectSlug: editedSlug,
					}),
				);
			}
		} catch (error) {
			chipToasts.error(i18nMessage("web:page.failedToUpdateProject"));
			console.error(
				i18nMessage("web:project.updateFailed", {
					error: error instanceof Error ? error.message : i18nMessage("common:unknownError"),
				}),
			);
		} finally {
			isUpdatingProject = false;
		}
	}

	async function deleteProject(repositoryId: string) {
		if (!confirm($i18nMessages.t("web:detail.5b94c5a718"))) {
			return;
		}

		await projectService.deleteProject(repositoryId);
		goto(routes.projectsPath());
	}

	async function handleDisconnectFromParent() {
		if (!confirm($i18nMessages.t("web:detail.b7dcb41eb7"))) {
			return;
		}

		try {
			await projectService.disconnectProject(projectData.repositoryId);
			projectData = {
				...projectData,
				parentProject: undefined,
				parentProjectRepositoryId: undefined,
			};
			chipToasts.success(i18nMessage("web:page.projectUnlinkedFromParent"));
		} catch (error) {
			chipToasts.error(i18nMessage("web:page.failedToUnlinkProject"));
			console.error(
				i18nMessage("web:project.unlinkFailed", {
					error: error instanceof Error ? error.message : i18nMessage("common:unknownError"),
				}),
			);
		}
	}

	let connectModal = $state<ReturnType<typeof ProjectConnectModal> | undefined>(undefined);
</script>

{#await projectPromise}
	<div class="loading-container">
		<p>{$i18nMessages.t("web:page.loadingProject")}</p>
	</div>
{:then _projectData}
	{#if _projectData}
		<div class="project-page">
			<header class="project-header">
				<div class="breadcrumb">
					<a href={routes.projectPath({ ownerSlug: data.ownerSlug, projectSlug: "" })}>
						{data.ownerSlug}
					</a>
					<span>/</span>
					<h1>{data.projectSlug}</h1>
				</div>
				{#if projectData.parentProject}
					<div class="parent-project-info">
						{#snippet i18nSlot1(content: import("svelte").Snippet)}<span class="label"
								>{@render content()}</span
							>{/snippet}
						{#snippet i18nSlot2(content: import("svelte").Snippet)}<a
								href={routes.projectPath({
									ownerSlug: projectData.parentProject.owner,
									projectSlug: projectData.parentProject.slug,
								})}>{@render content()}</a
							>{/snippet}
						<I18nRichMessage
							value={{
								key: "web:page.parentProjectValueValue",
								values: {
									owner: String(projectData.parentProject.owner),
									slug: String(projectData.parentProject.slug),
								},
							}}
							components={{ slot1: i18nSlot1, slot2: i18nSlot2 }}
						/>
					</div>
				{/if}
			</header>

			<div class="project-grid">
				<div class="main-content">
					<!-- Reviews section using the ReviewsSection component -->
					{#await patchStacksPromise}
						<ReviewsSection
							reviews={[]}
							status="loading"
							sectionTitle={$i18nMessages.t("web:page.activeReviews")}
						/>
					{:then _}
						<ReviewsSection
							reviews={patchStacksData || []}
							status={patchStacksData && patchStacksData.length > 0 ? "found" : "not-found"}
							sectionTitle={$i18nMessages.t("web:page.activeReviews")}
							allReviewsUrl={routes.projectReviewPath(data)}
							reviewsCount={projectData.activeReviewsCount || 0}
						/>
					{:catch error}
						<ReviewsSection
							reviews={[]}
							status="error"
							sectionTitle={$i18nMessages.t("web:page.activeReviews")}
						/>
						<div class="error-text">
							{$i18nMessages.t("web:page.errorLoadingReviewsValue", {
								value: error.localized ?? error.message ?? i18nMessage("common:unknownError"),
							})}
						</div>
					{/await}

					<section class="card">
						<div class="readme-header">
							<h2 class="card-title">{$i18nMessages.t("web:page.rEADME")}</h2>
							{#if projectData.permissions?.canWrite}
								<div class="readme-actions">
									{#if editingReadme}
										<AsyncButton
											style="pop"
											action={() => saveReadme(projectData.repositoryId)}
											disabled={isSavingReadme}
										>
											{$i18nMessages.t("web:page.save")}
										</AsyncButton>
										<Button
											type="button"
											style="gray"
											onclick={cancelEditingReadme}
											disabled={isSavingReadme}
										>
											{$i18nMessages.t("web:page.cancel")}
										</Button>
									{:else}
										<Button
											type="button"
											style="gray"
											onclick={() => startEditingReadme((projectData as any).readme)}
										>
											{$i18nMessages.t("web:page.editREADME")}
										</Button>
									{/if}
								</div>
							{/if}
						</div>
						<div class="card-content readme">
							{#if editingReadme}
								<textarea
									bind:value={readmeContent}
									class="readme-editor"
									rows="15"
									placeholder={$i18nMessages.t("web:page.enterMarkdownContentForTheREADME")}
									disabled={isSavingReadme}
								></textarea>
								<div class="readme-preview">
									<h3 class="preview-title">{$i18nMessages.t("web:page.preview")}</h3>
									<Markdown content={readmeContent} />
								</div>
							{:else if (projectData as any).readme}
								<Markdown content={(projectData as any).readme} />
							{:else}
								<div class="no-readme">
									{#if projectData.permissions?.canWrite}
										<p>{$i18nMessages.t("web:page.noREADMEAvailableForThisProjectClickEdit")}</p>
									{:else}
										<p>{$i18nMessages.t("web:page.noREADMEAvailableForThisProject")}</p>
									{/if}
								</div>
							{/if}
						</div>
					</section>
				</div>

				<div class="sidebar">
					<section class="card">
						<div class="card-header">
							<h2 class="card-title">{$i18nMessages.t("web:page.projectDetails")}</h2>
							{#if projectData.permissions?.canWrite}
								<Button
									type="button"
									style="pop"
									onclick={openEditProjectModal}
									class="edit-project-btn"
								>
									{$i18nMessages.t("web:page.editProject")}
								</Button>
							{/if}
						</div>
						<div class="card-content">
							{#if projectData.name}
								<h3 class="sidebar-section-title">{$i18nMessages.t("web:page.name")}</h3>
								<p class="description">
									{projectData.name}
								</p>
							{/if}
							{#if projectData.description}
								<h3 class="sidebar-section-title">{$i18nMessages.t("web:page.description")}</h3>
								<p class="description">
									{projectData.description}
								</p>
							{/if}

							<h3 class="sidebar-section-title">{$i18nMessages.t("web:page.lastUpdated")}</h3>
							<p class="description">{getTimeSince(projectData.updatedAt, $i18nMessages.locale)}</p>

							{#if projectData.lastPushedAt}
								<div class="meta-info">
									<div class="meta-item clone-url-container">
										<h3 class="sidebar-section-title">{$i18nMessages.t("web:page.cloneURL")}</h3>
										<div class="clone-url">
											<code>{projectData.codeGitUrl}</code>
											<Button
												type="button"
												style="pop"
												onclick={() => {
													navigator.clipboard.writeText(projectData.codeGitUrl);
													chipToasts.success(i18nMessage("web:page.inline20a35261a"));
												}}
											>
												{$i18nMessages.t("web:page.copy")}
											</Button>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</section>

					{#if projectData.parentProject}
						<section class="card">
							<h2 class="card-title">{$i18nMessages.t("web:page.parentProject")}</h2>
							<div class="card-content">
								<div class="parent-project-info-card">
									<p>
										{#snippet i18nSlot3(content: import("svelte").Snippet)}<a
												href={routes.projectPath({
													ownerSlug: projectData.parentProject?.owner || data.ownerSlug,
													projectSlug: projectData.parentProject?.slug || "",
												})}>{@render content()}</a
											>{/snippet}
										<I18nRichMessage
											value={{
												key: "web:page.thisProjectIsLinkedToAParentProject",
												values: {
													value: String(projectData.parentProject?.owner || data.ownerSlug),
													value2: String(
														projectData.parentProject?.slug ||
															projectData.parentProjectRepositoryId,
													),
												},
											}}
											components={{ slot3: i18nSlot3 }}
										/>
									</p>

									{#if projectData.permissions?.canWrite}
										<Button style="danger" onclick={handleDisconnectFromParent}>
											{$i18nMessages.t("web:page.disconnectFromParent")}
										</Button>
									{/if}
								</div>
							</div>
						</section>
					{:else if projectData.ownerType === "user" && projectData.permissions?.canWrite}
						<section class="card">
							<h2 class="card-title">{$i18nMessages.t("web:page.connectToOrganization")}</h2>
							<div class="card-content">
								<div class="connect-org-card">
									<p>{$i18nMessages.t("web:page.connectThisProjectToAnOrganizationToEnable")}</p>
									<Button style="pop" onclick={() => connectModal?.show()}>
										{$i18nMessages.t("web:page.connectToOrganization")}
									</Button>
								</div>
							</div>
						</section>

						<ProjectConnectModal
							bind:this={connectModal}
							projectRepositoryId={projectData.repositoryId}
						/>
					{/if}

					{#if projectData.permissions?.canWrite}
						<section class="card">
							<h2 class="card-title">{$i18nMessages.t("web:page.permissions")}</h2>
							<div class="card-content gap-2">
								<p>
									{#snippet i18nSlot4(content: import("svelte").Snippet)}<b>{@render content()}</b
										>{/snippet}
									<I18nRichMessage
										value={{
											key: "web:page.thisProjectIsValue",
											values: { shareLevel: String(projectData.permissions.shareLevel) },
										}}
										components={{ slot4: i18nSlot4 }}
									/>
								</p>
								<PermissionsSelector repositoryId={projectData.repositoryId} />
							</div>
						</section>

						<section class="card danger-zone">
							<h2 class="card-title danger-title">
								{$i18nMessages.t("web:page.dangerZone_8fc83aa")}
							</h2>
							<div class="card-content">
								<AsyncButton
									style="danger"
									action={async () => await deleteProject(projectData.repositoryId)}
								>
									{$i18nMessages.t("web:page.deleteProject")}
								</AsyncButton>
							</div>
						</section>
					{/if}
				</div>
			</div>
		</div>

		<!-- Edit Project Modal -->
		<Modal
			bind:this={editProjectModal}
			title={$i18nMessages.t("web:page.editProject")}
			onClose={() => {
				isUpdatingProject = false;
			}}
		>
			<form class="edit-project-form">
				<div class="form-group">
					<label for="project-name">{$i18nMessages.t("web:page.projectName")}</label>
					<input
						id="project-name"
						type="text"
						bind:value={editedName}
						placeholder={$i18nMessages.t("web:page.projectName_ab9773f")}
						required
						disabled={isUpdatingProject}
					/>
				</div>

				<div class="form-group">
					<label for="project-slug">{$i18nMessages.t("web:page.projectSlug")}</label>
					<input
						id="project-slug"
						type="text"
						bind:value={editedSlug}
						placeholder={$i18nMessages.t("web:page.projectSlug_b3673c9")}
						required
						disabled={isUpdatingProject}
						pattern="[a-z0-9-]+"
						title={$i18nMessages.t("web:page.lowercaseLettersNumbersAndHyphensOnly")}
					/>
					<small
						>{$i18nMessages.t("web:page.onlyLowercaseLettersNumbersAndHyphensAreAllowed")}</small
					>
				</div>

				<div class="form-group">
					<label for="project-description">{$i18nMessages.t("web:page.description")}</label>
					<textarea
						id="project-description"
						bind:value={editedDescription}
						placeholder={$i18nMessages.t("web:page.projectDescription")}
						rows="4"
						disabled={isUpdatingProject}
					></textarea>
				</div>

				<div class="form-actions">
					<Button
						type="button"
						style="gray"
						onclick={() => editProjectModal?.close()}
						disabled={isUpdatingProject}
					>
						{$i18nMessages.t("web:page.cancel")}
					</Button>
					<AsyncButton
						style="pop"
						action={() => saveProjectEdits(projectData.repositoryId)}
						disabled={isUpdatingProject}
					>
						{$i18nMessages.t("web:page.saveChanges")}
					</AsyncButton>
				</div>
			</form>
		</Modal>
	{:else}
		<div class="error-message">
			<h2>{$i18nMessages.t("web:page.projectNotFound")}</h2>
			<p>{$i18nMessages.t("web:page.theProjectYouRequestedCouldNotBeFound")}</p>
			<Button onclick={() => goto(routes.projectsPath())}
				>{$i18nMessages.t("web:page.returnToProjects")}</Button
			>
		</div>
	{/if}
{:catch error}
	<div class="error-message">
		<h2>{$i18nMessages.t("web:page.errorLoadingProject")}</h2>
		<p>
			{$i18nMessages.t("web:page.thereWasAProblemLoadingTheProjectValue", {
				value: error.localized ?? error.message ?? i18nMessage("common:unknownError"),
			})}
		</p>
		<Button onclick={() => goto(routes.projectsPath())}
			>{$i18nMessages.t("web:page.returnToProjects")}</Button
		>
	</div>
{/await}

<style lang="postcss">
	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-2);
		font-size: 1.2rem;
	}

	.error-text {
		padding: 1rem 0;
		color: var(--error, #dc3545);
		text-align: center;
	}

	.error-message {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 8px;
		background-color: var(--background, #fff);
		text-align: center;

		h2 {
			margin: 0 0 1rem;
			color: var(--error, #dc3545);
		}

		p {
			margin-bottom: 1.5rem;
		}
	}

	.project-header {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.parent-project-info {
		display: flex;
		align-items: center;
		margin-top: 10px;
		gap: 0.5rem;
		color: var(--text-2);
		font-size: 13px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.2rem;

		a {
			color: var(--text-2);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		h1 {
			margin: 0;
		}
	}

	.project-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card {
		overflow: hidden;
		border: 1px solid color(srgb 0.831373 0.815686 0.807843);
		border-radius: 8px;
		background-color: white;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-right: 15px;
		border-bottom: 1px solid color(srgb 0.831373 0.815686 0.807843);
		background-color: #f3f3f2;
	}

	.card-title {
		margin: 0;
		padding: 12px 15px;
		border-bottom: 1px solid color(srgb 0.831373 0.815686 0.807843);
		background-color: #f3f3f2;
		color: color(srgb 0.52549 0.494118 0.47451);
		font-size: 0.8em;
	}

	.card-header .card-title {
		border-bottom: none;
	}

	.readme-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid color(srgb 0.831373 0.815686 0.807843);
		background-color: #f3f3f2;
	}

	.readme-header .card-title {
		border-bottom: none;
	}

	.readme-actions {
		display: flex;
		padding-right: 15px;
		gap: 0.5rem;
	}

	.readme-editor {
		width: 100%;
		min-height: 200px;
		margin-bottom: 1rem;
		padding: 0.75rem;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 4px;
		font-family: var(--font-mono);
		resize: vertical;
	}

	.readme-preview {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #eaeaea);
	}

	.preview-title {
		margin: 0 0 0.75rem 0;
		color: var(--text-2);
		font-size: 1rem;
	}

	.card-content {
		padding: 1rem;
	}

	.meta-info {
		margin-top: 1.5rem;
	}

	.meta-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.sidebar-section-title {
		margin: 0 0 0.5rem 0;
		color: var(--text-2);
		font-size: 1rem;
	}

	.description {
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}

	.clone-url-container {
		display: block;
	}

	.clone-url {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 0.5rem;

		code {
			flex: 1;
			padding: 0.25rem 0.5rem;
			overflow: hidden;
			border-radius: 4px;
			background: var(--background-alt, #f5f5f5);
			font-family: var(--font-mono);
			text-overflow: ellipsis;
		}
	}

	.parent-project-info-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			margin: 0;
			line-height: 1.4;
		}

		a {
			display: inline-block;
			margin-top: 0.25rem;
			color: var(--clr-pop-50);
			font-weight: 500;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.readme {
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.danger-title {
		color: var(--error, #dc3545);
	}

	.danger-zone {
		margin-top: auto;
	}

	.gap-2 {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.no-readme {
		padding: 0.5rem 0;
		color: #718096;
		text-align: center;
	}

	.connect-org-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			margin: 0;
			line-height: 1.4;
		}
	}

	.edit-project-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.5rem;
		border: 1px solid color(srgb 0.831373 0.815686 0.807843);
		border-radius: 4px;
		font-size: 14px;
	}

	.form-group small {
		color: var(--text-2);
		font-size: 12px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.project-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
