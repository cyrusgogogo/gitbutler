<script lang="ts">
	import BitbucketAccountBadge from "$components/forge/BitbucketAccountBadge.svelte";
	import GitHubAccountBadge from "$components/forge/GitHubAccountBadge.svelte";
	import GitLabAccountBadge from "$components/forge/GitLabAccountBadge.svelte";
	import ForgeAccountConfig from "$components/projectSettings/ForgeAccountConfig.svelte";
	import GitHubOrgRestrictionNotice from "$components/projectSettings/GitHubOrgRestrictionNotice.svelte";
	import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
	import { isNormalizedError } from "$lib/error/normalizedError";
	import {
		bitbucketAccountIdentifierToString,
		stringToBitbucketAccountIdentifier,
	} from "$lib/forge/bitbucket/bitbucketUserService.svelte";
	import { usePreferredBitbucketUsername } from "$lib/forge/bitbucket/hooks.svelte";
	import { FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import {
		githubAccountIdentifierToString,
		stringToGitHubAccountIdentifier,
	} from "$lib/forge/github/githubUserService.svelte";
	import { usePreferredGitHubUsername } from "$lib/forge/github/hooks.svelte";
	import {
		gitlabAccountIdentifierToString,
		stringToGitLabAccountIdentifier,
	} from "$lib/forge/gitlab/gitlabUserService.svelte";
	import { usePreferredGitLabUsername } from "$lib/forge/gitlab/hooks.svelte";
	import { LISTING_SERVICE } from "$lib/forge/listingService.svelte";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { reactive } from "@gitbutler/shared/reactiveUtils.svelte";
	import { CardGroup, Select, SelectItem } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import type { Project } from "$lib/project/project";
	import type {
		BitbucketAccountIdentifier,
		ForgeName,
		ForgeUser,
		GitHubStackingMode,
		GithubAccountIdentifier,
		GitlabAccountIdentifier,
		ReviewStackingDescription,
	} from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

	type ForgeSelection = ForgeName | "default";

	const FORGE_OPTIONS: { label: string; value: ForgeSelection }[] = $derived([
		{ label: $i18nMessages.t("desktop:ForgeForm.none"), value: "default" },
		{ label: "GitHub", value: "github" },
		{ label: "GitLab", value: "gitlab" },
		{ label: $i18nMessages.t("desktop:ForgeForm.azure"), value: "azure" },
		{ label: $i18nMessages.t("desktop:ForgeForm.bitBucket"), value: "bitbucket" },
	]);

	const { projectId }: { projectId: string } = $props();

	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeInfo = $derived(forgeInfoQuery.response);
	const determinedForgeType = $derived(forgeInfo?.name ?? "default");
	const projectsService = inject(PROJECTS_SERVICE);
	const gitConfigService = inject(GIT_CONFIG_SERVICE);
	const gitConfigQuery = $derived(gitConfigService.gbConfig(projectId));
	const reviewStackingDescription = $derived(
		(gitConfigQuery.response?.gitbutlerReviewStackingDescription ??
			"bottom") as ReviewStackingDescription,
	);
	const githubStackingMode = $derived(
		(gitConfigQuery.response?.gitbutlerGithubStackingMode ?? "auto") as GitHubStackingMode,
	);
	const projectQuery = $derived(projectsService.getProject(projectId));
	const project = $derived(projectQuery.response);

	const selectedOption = $derived(project?.forge_override || "default");

	// GitHub hooks
	const { preferredGitHubAccount, githubAccounts } = usePreferredGitHubUsername(
		reactive(() => projectId),
	);

	// The workspace's polled review listing keeps this cache entry current,
	// so it reflects whether the integration currently works at all.
	const listingService = inject(LISTING_SERVICE);
	const listingState = $derived(listingService.listingState(projectId));
	const listingError = $derived(listingState.result.error);
	const listingErrorCode = $derived(
		isNormalizedError(listingError) ? listingError.code : undefined,
	);

	// GitLab hooks
	const { preferredGitLabAccount, gitlabAccounts } = usePreferredGitLabUsername(
		reactive(() => projectId),
	);

	// Bitbucket hooks
	const { preferredBitbucketAccount, bitbucketAccounts } = usePreferredBitbucketUsername(
		reactive(() => projectId),
	);

	function handleSelectionChange(selectedOption: ForgeSelection) {
		if (!project) return;

		const mutableProject: Project & { unset_forge_override?: boolean } = structuredClone(project);

		if (selectedOption === "default") {
			mutableProject.unset_forge_override = true;
		} else {
			mutableProject.forge_override = selectedOption;
		}
		projectsService.updateProject(mutableProject);
	}

	async function updatePreferredForgeUser(projectId: string, forgeUser: ForgeUser) {
		await projectsService.updatePreferredForgeUser(projectId, forgeUser);
		// The cached review listing was fetched with the previous account's
		// credentials; refresh it so a credential-caused failure (e.g. an
		// org OAuth restriction) clears as soon as the account changes
		// instead of on the next 15-minute poll.
		await listingService.refresh(projectId);
	}

	async function updatePreferredGitHubAccount(projectId: string, account: GithubAccountIdentifier) {
		await updatePreferredForgeUser(projectId, { provider: "github", details: account });
	}

	async function updatePreferredGitLabAccount(projectId: string, account: GitlabAccountIdentifier) {
		await updatePreferredForgeUser(projectId, { provider: "gitlab", details: account });
	}

	async function updatePreferredBitbucketAccount(
		projectId: string,
		account: BitbucketAccountIdentifier,
	) {
		await updatePreferredForgeUser(projectId, { provider: "bitbucket", details: account });
	}

	async function updateReviewStackingDescription(value: ReviewStackingDescription) {
		await gitConfigService.setGbConfig(projectId, { gitbutlerReviewStackingDescription: value });
	}

	async function updateGitHubStackingMode(value: GitHubStackingMode) {
		await gitConfigService.setGbConfig(projectId, { gitbutlerGithubStackingMode: value });
	}
</script>

<CardGroup>
	<CardGroup.Item>
		{#snippet title()}
			{$i18nMessages.t("desktop:ForgeForm.forgeOverride")}
		{/snippet}

		{#snippet caption()}
			{#if determinedForgeType === "default"}
				{#snippet i18nSlot1()}<br />{/snippet}
				{#snippet i18nSlot2()}<br />{/snippet}
				{#snippet i18nSlot3(content: import("svelte").Snippet)}<span class="text-bold"
						>{@render content()}</span
					>{/snippet}
				<I18nRichMessage
					value={{ key: "desktop:ForgeForm.weCouldnTDetectWhichForgeYouRe" }}
					components={{ slot1: i18nSlot1, slot2: i18nSlot2, slot3: i18nSlot3 }}
				/>
			{:else}
				{#snippet i18nSlot4(content: import("svelte").Snippet)}<span class="text-bold"
						>{@render content()}</span
					>{/snippet}
				{#snippet i18nSlot5()}<br />{/snippet}
				<I18nRichMessage
					value={{
						key: "desktop:ForgeForm.weVeDetectedThatYouReUsingValue",
						values: { value: String(determinedForgeType.toUpperCase()) },
					}}
					components={{ slot4: i18nSlot4, slot5: i18nSlot5 }}
				/>
			{/if}
		{/snippet}

		{#if determinedForgeType === "default"}
			<Select
				value={selectedOption}
				options={FORGE_OPTIONS}
				wide
				onselect={(value) => handleSelectionChange(value as ForgeSelection)}
			>
				{#snippet itemSnippet({ item, highlighted })}
					<SelectItem selected={item.value === selectedOption} {highlighted}>
						{item.label}
					</SelectItem>
				{/snippet}
			</Select>
		{/if}
	</CardGroup.Item>

	<CardGroup.Item>
		{#snippet title()}
			{$i18nMessages.t("desktop:ForgeForm.stackInformationInReviewDescriptions")}
		{/snippet}

		{#snippet caption()}
			{$i18nMessages.t(
				"desktop:ForgeForm.chooseWhereGitButlerManagedStackInformationAppearsChanges",
			)}
		{/snippet}

		<div data-testid="review-stacking-description-select">
			<Select
				value={reviewStackingDescription}
				options={[
					{ label: $i18nMessages.t("desktop:ForgeForm.bottom"), value: "bottom" },
					{ label: $i18nMessages.t("desktop:ForgeForm.top"), value: "top" },
					{ label: $i18nMessages.t("desktop:ForgeForm.disabled"), value: "disabled" },
				]}
				wide
				onselect={(value) => updateReviewStackingDescription(value as ReviewStackingDescription)}
			>
				{#snippet itemSnippet({ item, highlighted })}
					<div data-testid={`review-stacking-description-option-${item.value}`}>
						<SelectItem selected={item.value === reviewStackingDescription} {highlighted}>
							{item.label}
						</SelectItem>
					</div>
				{/snippet}
			</Select>
		</div>
	</CardGroup.Item>

	{#if forgeInfo?.name === "github"}
		<CardGroup.Item>
			{#snippet title()}
				{$i18nMessages.t("desktop:ForgeForm.nativeGitHubStackedPullRequests")}
			{/snippet}

			{#snippet caption()}
				{$i18nMessages.t("desktop:ForgeForm.registerThisProjectSReviewedStacksWithGitHub")}
			{/snippet}

			<div data-testid="github-stacking-mode-select">
				<Select
					value={githubStackingMode}
					options={[
						{ label: $i18nMessages.t("desktop:ForgeForm.inlinec614ba7c4"), value: "auto" },
						{ label: $i18nMessages.t("desktop:ForgeForm.disabled"), value: "disabled" },
						{ label: $i18nMessages.t("desktop:ForgeForm.native"), value: "native" },
					]}
					wide
					onselect={(value) => updateGitHubStackingMode(value as GitHubStackingMode)}
				>
					{#snippet itemSnippet({ item, highlighted })}
						<div data-testid={`github-stacking-mode-option-${item.value}`}>
							<SelectItem selected={item.value === githubStackingMode} {highlighted}>
								{item.label}
							</SelectItem>
						</div>
					{/snippet}
				</Select>
			</div>
		</CardGroup.Item>

		<ForgeAccountConfig
			{projectId}
			displayName="GitHub"
			accounts={githubAccounts.current}
			preferredAccount={preferredGitHubAccount.current}
			accountToString={githubAccountIdentifierToString}
			stringToAccount={stringToGitHubAccountIdentifier}
			getUsername={(account) => account.info.username}
			updatePreferredAccount={updatePreferredGitHubAccount}
			AccountBadge={GitHubAccountBadge}
			docsUrl="https://docs.gitbutler.com/features/forge-integration/github-integration"
			requestType="pull request"
		>
			{#snippet notice()}
				<GitHubOrgRestrictionNotice errorCode={listingErrorCode} />
			{/snippet}
		</ForgeAccountConfig>
	{/if}

	{#if forgeInfo?.name === "gitlab"}
		<ForgeAccountConfig
			{projectId}
			displayName="GitLab"
			accounts={gitlabAccounts.current}
			preferredAccount={preferredGitLabAccount.current}
			accountToString={gitlabAccountIdentifierToString}
			stringToAccount={stringToGitLabAccountIdentifier}
			getUsername={(account) => account.info.username}
			updatePreferredAccount={updatePreferredGitLabAccount}
			AccountBadge={GitLabAccountBadge}
			docsUrl="https://docs.gitbutler.com/features/forge-integration/gitlab-integration"
			requestType="merge request"
		/>
	{/if}

	{#if forgeInfo?.name === "bitbucket"}
		<ForgeAccountConfig
			{projectId}
			displayName="Bitbucket"
			accounts={bitbucketAccounts.current}
			preferredAccount={preferredBitbucketAccount.current}
			accountToString={bitbucketAccountIdentifierToString}
			stringToAccount={stringToBitbucketAccountIdentifier}
			getUsername={(account) => account.info.email}
			updatePreferredAccount={updatePreferredBitbucketAccount}
			AccountBadge={BitbucketAccountBadge}
			docsUrl="https://docs.gitbutler.com/features/forge-integration/bitbucket-integration"
			requestType="pull request"
		/>
	{/if}
</CardGroup>
