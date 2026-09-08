<script lang="ts">
	import GitlabUserLoginState from "$components/settings/GitlabUserLoginState.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import gitlabLogoSvg from "$lib/assets/unsized-logos/gitlab.svg?raw";
	import {
		gitLabEnterprisePatError,
		GITLAB_USER_SERVICE,
	} from "$lib/forge/gitlab/gitlabUserService.svelte";

	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { AddForgeAccountButton, Button, CardGroup, Link, Textbox } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { fade } from "svelte/transition";
	import type { LocalizedText } from "@gitbutler/i18n";
	const i18nMessages = useTranslations();

	const gitlabUserService = inject(GITLAB_USER_SERVICE);

	const [clearAll, clearingAllResult] = gitlabUserService.deleteAllGitLabAccounts();
	const [storePat, storePatResult] = gitlabUserService.storeGitLabPat;
	const [storeSelfHostedPat, storeSelfHostedPatResult] = gitlabUserService.storeGitLabEnterprisePat;
	const accounts = gitlabUserService.accounts();

	let showingFlow = $state<"pat" | "selfHosted">();

	// PAT flow state
	let patInput = $state<string>();
	let patError = $state<LocalizedText>();

	// Self-hosted GitLab flow state
	let selfHostedPatInput = $state<string>();
	let selfHostedHostInput = $state<string>();
	let selfHostedPatError = $state<LocalizedText>();
	let selfHostedHostError = $state<string>();

	function cleanupPatFlow() {
		showingFlow = undefined;
		patInput = undefined;
		patError = undefined;
	}

	function cleanupSelfHostedFlow() {
		showingFlow = undefined;
		selfHostedPatInput = undefined;
		selfHostedHostInput = undefined;
		selfHostedPatError = undefined;
		selfHostedHostError = undefined;
	}

	async function deleteAllGitLabAccounts() {
		await clearAll();
		startPatFlow();
	}

	function startPatFlow() {
		showingFlow = "pat";
	}

	async function storePersonalAccessToken() {
		if (!patInput) return;
		patError = undefined;
		try {
			await storePat({ accessToken: patInput });

			cleanupPatFlow();
		} catch (err: any) {
			console.error("Failed to store GitLab PAT:", err);
			patError = i18nMessage("desktop:detail.717e974744");
		}
	}

	function startSelfHostedFlow() {
		showingFlow = "selfHosted";
	}

	async function storeSelfHostedToken() {
		if (!selfHostedPatInput || !selfHostedHostInput) return;
		selfHostedPatError = undefined;
		selfHostedHostError = undefined;
		try {
			await storeSelfHostedPat({ accessToken: selfHostedPatInput, host: selfHostedHostInput });

			cleanupSelfHostedFlow();
		} catch (err: unknown) {
			console.error("Failed to store self-hosted GitLab PAT:", err);
			selfHostedPatError = gitLabEnterprisePatError(err);
		}
	}
</script>

<div class="stack-v gap-8">
	<CardGroup>
		<ReduxResult result={accounts.result}>
			<!-- IF ERROR -->
			{#snippet error()}
				<CardGroup.Item>
					{#snippet title()}
						{$i18nMessages.t("desktop:GitlabIntegration.failedToLoadGitLabAccounts")}
					{/snippet}
					<Button
						style="pop"
						onclick={deleteAllGitLabAccounts}
						loading={clearingAllResult.current.isLoading}
						>{$i18nMessages.t("desktop:GitlabIntegration.tryAgain")}</Button
					>
				</CardGroup.Item>
			{/snippet}

			<!-- ADD ACCOUNT(S) LIST -->
			{#snippet children(accounts)}
				{@const noAccounts = accounts.length === 0}
				{#each accounts as account}
					<GitlabUserLoginState {account} />
				{/each}

				<CardGroup.Item background={accounts.length > 0 ? "var(--bg-2)" : undefined}>
					{#snippet iconSide()}
						<div class="icon-wrapper__logo">
							{@html gitlabLogoSvg}
						</div>
					{/snippet}

					{#snippet title()}
						GitLab
					{/snippet}

					{#snippet caption()}
						{$i18nMessages.t("desktop:GitlabIntegration.allowsYouToCreateMergeRequests")}
					{/snippet}

					{#snippet actions()}
						{@render addProfileButton(noAccounts)}
					{/snippet}
				</CardGroup.Item>
			{/snippet}
		</ReduxResult>
	</CardGroup>

	<!-- PAT FLOW -->
	{#if showingFlow === "pat"}
		<div in:fade={{ duration: 100 }}>
			<CardGroup>
				<CardGroup.Item>
					{#snippet title()}
						{$i18nMessages.t("desktop:GitlabIntegration.addPersonalAccessToken")}
					{/snippet}

					<Textbox
						size="large"
						type="password"
						value={patInput}
						placeholder={$i18nMessages.t("desktop:GitlabIntegration.glpat")}
						oninput={(value) => (patInput = value)}
						error={$i18nMessages.text(patError ?? "")}
					/>
				</CardGroup.Item>
				<CardGroup.Item>
					<div class="flex justify-end gap-6">
						<Button style="gray" kind="outline" onclick={cleanupPatFlow}
							>{$i18nMessages.t("desktop:GitlabIntegration.cancel")}</Button
						>
						<Button
							style="pop"
							disabled={!patInput}
							loading={storePatResult.current.isLoading}
							onclick={storePersonalAccessToken}
						>
							{$i18nMessages.t("desktop:GitlabIntegration.addAccount")}
						</Button>
					</div>
				</CardGroup.Item>
			</CardGroup>
		</div>
	{:else if showingFlow === "selfHosted"}
		<div in:fade={{ duration: 100 }}>
			<CardGroup>
				<CardGroup.Item>
					{#snippet title()}
						{$i18nMessages.t("desktop:GitlabIntegration.addSelfHostedGitLabAccount")}
					{/snippet}

					{#snippet caption()}
						{#snippet i18nSlot1()}<br />{/snippet}
						<I18nRichMessage
							value={{ key: "desktop:GitlabIntegration.toConnectToYourSelfHostedGitLabAPI" }}
							components={{ slot1: i18nSlot1 }}
						/>
						<Link href="https://docs.gitbutler.com/troubleshooting/custom-csp"
							>{$i18nMessages.t("desktop:GitlabIntegration.docsForDetails")}</Link
						>
					{/snippet}

					<Textbox
						label={$i18nMessages.t("desktop:GitlabIntegration.aPIBaseURL")}
						size="large"
						value={selfHostedHostInput}
						oninput={(value) => (selfHostedHostInput = value)}
						helperText="This should be the root URL of the API. For example, if your GitLab instance's hostname is gitlab.acme-inc.com, then set the base URL to https://gitlab.acme-inc.com"
						error={selfHostedHostError}
					/>
					<Textbox
						label={$i18nMessages.t("desktop:GitlabIntegration.personalAccessToken")}
						placeholder={$i18nMessages.t("desktop:GitlabIntegration.glpat")}
						size="large"
						type="password"
						value={selfHostedPatInput}
						oninput={(value) => (selfHostedPatInput = value)}
						error={$i18nMessages.text(selfHostedPatError ?? "")}
					/>
				</CardGroup.Item>
				<CardGroup.Item>
					<div class="flex justify-end gap-6">
						<Button style="gray" kind="outline" onclick={cleanupSelfHostedFlow}
							>{$i18nMessages.t("desktop:GitlabIntegration.cancel")}</Button
						>
						<Button
							style="pop"
							disabled={!selfHostedHostInput || !selfHostedPatInput}
							loading={storeSelfHostedPatResult.current.isLoading}
							onclick={storeSelfHostedToken}
						>
							{$i18nMessages.t("desktop:GitlabIntegration.addAccount")}
						</Button>
					</div>
				</CardGroup.Item>
			</CardGroup>
		</div>
	{/if}
</div>

{#snippet addProfileButton(noAccounts: boolean)}
	<AddForgeAccountButton
		{noAccounts}
		disabled={showingFlow !== undefined}
		loading={storePatResult.current.isLoading || storeSelfHostedPatResult.current.isLoading}
		menuItems={[
			{
				label: $i18nMessages.t("desktop:GitlabIntegration.inlinec08af6fc3"),
				icon: "lock-auth",
				onclick: startPatFlow,
			},
			{
				label: $i18nMessages.t("desktop:GitlabIntegration.inlinedc4ca92d7"),
				icon: "factory",
				onclick: startSelfHostedFlow,
			},
		]}
	/>
{/snippet}

<style lang="postcss">
	.icon-wrapper__logo {
		width: 28px;
		height: 28px;
	}
</style>
