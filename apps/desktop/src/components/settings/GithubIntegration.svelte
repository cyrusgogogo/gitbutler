<script lang="ts">
	import GithubUserLoginState from "$components/settings/GithubUserLoginState.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import githubLogoSvg from "$lib/assets/unsized-logos/github.svg?raw";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { URL_SERVICE } from "$lib/backend/url";
	import { classifyGitHubDeviceOAuthFailure } from "$lib/error/errorClassification";
	import { GITHUB_USER_SERVICE } from "$lib/forge/github/githubUserService.svelte";
	import { canonicalMessages } from "$lib/notifications/toasts";

	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		AddForgeAccountButton,
		Button,
		CardGroup,
		Link,
		Textbox,
		Spacer,
		chipToasts as toasts,
	} from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { fade } from "svelte/transition";
	import type { LocalizedText } from "@gitbutler/i18n";
	const i18nMessages = useTranslations();

	const githubUserService = inject(GITHUB_USER_SERVICE);
	const urlService = inject(URL_SERVICE);
	const clipboardService = inject(CLIPBOARD_SERVICE);

	const [clearAll, clearingAllResult] = githubUserService.deleteAllGitHubAccounts();
	const [storePat, storePatResult] = githubUserService.storeGitHubPat;
	const [storeGhePat, storeGhePatResult] = githubUserService.storeGithuibEnterprisePat;
	const accounts = githubUserService.accounts();

	let showingFlow = $state<"oauthFlow" | "pat" | "ghe">();

	// OAuth step flags
	let codeCopied = $state(false);
	let GhActivationLinkPressed = $state(false);
	let GhActivationPageOpened = $state(false);

	let loading = $state(false);
	let userCode = $state("");
	let deviceCode = $state("");

	// PAT flow state
	let patInput = $state<string>();
	let patError = $state<LocalizedText>();

	// GitHub Enterprise flow state
	let ghePatInput = $state<string>();
	let gheHostInput = $state<string>();
	let ghePatError = $state<LocalizedText>();
	let gheHostError = $state<string>();

	function cleanupAuthFlow() {
		showingFlow = undefined;
		codeCopied = false;
		GhActivationLinkPressed = false;
		GhActivationPageOpened = false;
	}

	function cleanupPatFlow() {
		showingFlow = undefined;
		patInput = undefined;
		patError = undefined;
	}

	function cleanupGheFlow() {
		showingFlow = undefined;
		ghePatInput = undefined;
		gheHostInput = undefined;
		ghePatError = undefined;
		gheHostError = undefined;
	}

	/** One safe label serves the console, the toast, and telemetry; the raw rejection is never shown. */
	function reportOAuthFailure(err: unknown) {
		const { message, code, severity } = classifyGitHubDeviceOAuthFailure(err);
		const failure = {
			name: "GitHub OAuth failed",
			message: canonicalMessages.text(message),
			...(code && { code }),
		};
		console.error("GitHub device OAuth failed", failure);
		(severity === "warning" ? toasts.warning : toasts.error)(message);
	}

	function gitHubStartOauth() {
		githubUserService
			.initDeviceOauth()
			.then((verification) => {
				userCode = verification.user_code;
				deviceCode = verification.device_code;
				showingFlow = "oauthFlow";
				// Reset all step flags for a fresh auth flow
				codeCopied = false;
				GhActivationLinkPressed = false;
				GhActivationPageOpened = false;
			})
			.catch(reportOAuthFailure);
	}

	async function gitHubOauthCheckStatus(deviceCode: string) {
		loading = true;
		try {
			await githubUserService.checkAuthStatus({ deviceCode });
			toasts.success(i18nMessage("desktop:github.authenticated"));
		} catch (err: unknown) {
			reportOAuthFailure(err);
		} finally {
			// Reset the auth flow on completion
			cleanupAuthFlow();
			loading = false;
		}
	}

	async function deleteAllGitHubAccounts() {
		await clearAll();
		gitHubStartOauth();
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
			console.error("Failed to store GitHub PAT:", err);
			patError = i18nMessage("desktop:detail.717e974744");
		}
	}

	function startGitHubEnterpriseFlow() {
		showingFlow = "ghe";
	}

	async function storeGitHubEnterpriseToken() {
		if (!ghePatInput || !gheHostInput) return;
		ghePatError = undefined;
		gheHostError = undefined;
		try {
			await storeGhePat({ accessToken: ghePatInput, host: gheHostInput });

			cleanupGheFlow();
		} catch (err: any) {
			console.error("Failed to store GitHub Enterprise PAT:", err);
			ghePatError = i18nMessage("desktop:detail.a9fa8428e8");
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
						{$i18nMessages.t("desktop:GithubIntegration.failedToLoadGitHubAccounts")}
					{/snippet}
					<Button
						style="pop"
						onclick={deleteAllGitHubAccounts}
						loading={clearingAllResult.current.isLoading}
						>{$i18nMessages.t("desktop:GithubIntegration.tryAgain")}</Button
					>
				</CardGroup.Item>
			{/snippet}

			<!-- ADD ACCOUNT(S) LIST -->
			{#snippet children(accounts)}
				{@const noAccounts = accounts.length === 0}
				{#each accounts as account}
					<GithubUserLoginState {account} />
				{/each}

				<CardGroup.Item background={accounts.length > 0 ? "var(--bg-2)" : undefined}>
					{#snippet iconSide()}
						<div class="icon-wrapper__logo">
							{@html githubLogoSvg}
						</div>
					{/snippet}

					{#snippet title()}
						GitHub
					{/snippet}

					{#snippet caption()}
						{$i18nMessages.t("desktop:GithubIntegration.allowsYouToCreatePullRequests")}
					{/snippet}

					{#snippet actions()}
						{@render addProfileButton(noAccounts)}
					{/snippet}
				</CardGroup.Item>
			{/snippet}
		</ReduxResult>
	</CardGroup>

	<!-- AUTH FLOW -->
	{#if showingFlow === "oauthFlow"}
		<div in:fade={{ duration: 100 }}>
			<CardGroup.Item standalone>
				<div class="close-button-wrapper">
					<Button kind="ghost" style="gray" icon="cross" onclick={cleanupAuthFlow} />
				</div>

				<div class="wrapper">
					<div class="step-section">
						<div class="step-line"></div>
						<div class="step-section__content">
							<p class="text-13 text-body">
								{$i18nMessages.t("desktop:GithubIntegration.copyTheFollowingVerificationCode")}
							</p>

							<div class="code-wrapper">
								<span class="text-head-20">
									{userCode}
								</span>
								<Button
									style="gray"
									kind="outline"
									icon="copy"
									disabled={codeCopied}
									onclick={() => {
										clipboardService.write(userCode, {
											message: i18nMessage("desktop:GithubIntegration.inline3f3a9bc91"),
										});
										codeCopied = true;
									}}
								>
									{$i18nMessages.t("desktop:GithubIntegration.copyToClipboard")}
								</Button>
							</div>
						</div>
					</div>

					{#if codeCopied}
						<div class="step-section" in:fade={{ duration: 100 }}>
							<div class="step-line step-line-default"></div>
							<div class="step-section__content">
								<p class="text-13 text-body">
									{$i18nMessages.t(
										"desktop:GithubIntegration.navigateToTheGitHubActivationPageAndPaste",
									)}
								</p>
								<Button
									style="pop"
									disabled={GhActivationLinkPressed}
									icon="arrow-up-righ"
									onclick={() => {
										urlService.openExternalUrl("https://github.com/login/device");
										GhActivationLinkPressed = true;

										// add timeout to prevent show the check button before the page is opened
										setTimeout(() => {
											GhActivationPageOpened = true;
										}, 500);
									}}
								>
									{$i18nMessages.t("desktop:GithubIntegration.openGitHubActivationPage")}
								</Button>
							</div>
						</div>
					{/if}

					{#if GhActivationPageOpened}
						<div class="step-section" in:fade={{ duration: 100 }}>
							<div class="step-line step-line-last"></div>
							<div class="step-section__content">
								<Button
									style="pop"
									{loading}
									disabled={loading}
									onclick={async () => {
										await gitHubOauthCheckStatus(deviceCode);
									}}
								>
									{$i18nMessages.t("desktop:GithubIntegration.checkTheStatus")}
								</Button>
							</div>
						</div>
					{/if}
				</div>
			</CardGroup.Item>
		</div>

		<!-- PAT FLOW -->
	{:else if showingFlow === "pat"}
		<CardGroup>
			<CardGroup.Item>
				{#snippet title()}
					{$i18nMessages.t("desktop:GithubIntegration.addPersonalAccessToken")}
				{/snippet}

				<Textbox
					size="large"
					type="password"
					value={patInput}
					placeholder={$i18nMessages.t("desktop:GithubIntegration.ghp")}
					oninput={(value) => (patInput = value)}
					error={$i18nMessages.text(patError ?? "")}
				/>
			</CardGroup.Item>
			<CardGroup.Item>
				<div class="flex justify-end gap-6">
					<Button style="gray" kind="outline" onclick={cleanupPatFlow}
						>{$i18nMessages.t("desktop:GithubIntegration.cancel")}</Button
					>
					<Button
						style="pop"
						disabled={!patInput}
						loading={storePatResult.current.isLoading}
						onclick={storePersonalAccessToken}
					>
						{$i18nMessages.t("desktop:GithubIntegration.addAccount")}
					</Button>
				</div>
			</CardGroup.Item>
		</CardGroup>
	{:else if showingFlow === "ghe"}
		<CardGroup>
			<CardGroup.Item>
				{#snippet title()}
					{$i18nMessages.t("desktop:GithubIntegration.addGitHubEnterpriseAccount")}
				{/snippet}

				{#snippet caption()}
					{#snippet i18nSlot1()}<br />{/snippet}
					<I18nRichMessage
						value={{ key: "desktop:GithubIntegration.toConnectToYourGitHubEnterpriseAPIAllow" }}
						components={{ slot1: i18nSlot1 }}
					/>
					<Link href="https://docs.gitbutler.com/troubleshooting/custom-csp"
						>{$i18nMessages.t("desktop:GithubIntegration.docsForDetails")}</Link
					>
				{/snippet}

				<Textbox
					label={$i18nMessages.t("desktop:GithubIntegration.aPIBaseURL")}
					size="large"
					value={gheHostInput}
					oninput={(value) => (gheHostInput = value)}
					helperText="This should be the root URL of the API. For example, if your GitHub Enterprise Server's hostname is github.acme-inc.com, then set the base URL to https://github.acme-inc.com/api/v3"
					error={gheHostError}
				/>
				<Textbox
					label={$i18nMessages.t("desktop:GithubIntegration.personalAccessToken")}
					placeholder={$i18nMessages.t("desktop:GithubIntegration.ghp")}
					size="large"
					type="password"
					value={ghePatInput}
					oninput={(value) => (ghePatInput = value)}
					error={$i18nMessages.text(ghePatError ?? "")}
				/>
			</CardGroup.Item>
			<CardGroup.Item>
				<div class="flex justify-end gap-6">
					<Button style="gray" kind="outline" onclick={cleanupGheFlow}
						>{$i18nMessages.t("desktop:GithubIntegration.cancel")}</Button
					>
					<Button
						style="pop"
						disabled={!gheHostInput || !ghePatInput}
						loading={storeGhePatResult.current.isLoading}
						onclick={storeGitHubEnterpriseToken}
					>
						{$i18nMessages.t("desktop:GithubIntegration.addAccount")}
					</Button>
				</div>
			</CardGroup.Item>
		</CardGroup>
	{/if}

	{#if showingFlow}
		<Spacer dotted margin={8} />
	{/if}
</div>

{#snippet addProfileButton(noAccounts: boolean)}
	<AddForgeAccountButton
		{noAccounts}
		disabled={showingFlow !== undefined}
		loading={storePatResult.current.isLoading || storeGhePatResult.current.isLoading}
		menuItems={[
			{
				label: $i18nMessages.t("desktop:GithubIntegration.inlinee8ba97430"),
				icon: "link",
				onclick: gitHubStartOauth,
			},
			{
				label: $i18nMessages.t("desktop:GithubIntegration.inlinec08af6fc3"),
				icon: "lock-auth",
				onclick: startPatFlow,
			},
			{
				label: $i18nMessages.t("desktop:GithubIntegration.inline91554f158"),
				icon: "factory",
				onclick: startGitHubEnterpriseFlow,
			},
		]}
	/>
{/snippet}

<style lang="postcss">
	.close-button-wrapper {
		display: flex;
		position: absolute;
		top: 8px;
		right: 8px;
	}

	.wrapper {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.icon-wrapper__logo {
		width: 28px;
		height: 28px;
	}

	.step-section {
		display: flex;
		margin-left: 8px;
		gap: 16px;

		&:first-child {
			& .step-section__content {
				&::before {
					display: none;
				}
			}
		}
	}

	.step-section__content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		margin-bottom: 12px;
		margin-left: 8px;
		gap: 12px;

		&:before {
			display: block;
			width: 100%;
			height: 1px;
			margin-top: 8px;
			margin-bottom: 6px;
			background-color: var(--border-1);
			content: "";
			opacity: 0.4;
		}
	}

	/* STEP LINES */
	.step-line {
		position: relative;
		width: 1px;
		margin-top: 4px;
		border-right: 1px dashed var(--border-1);

		&::before {
			position: absolute;
			left: 50%;
			width: 10px;
			height: 10px;
			transform: translateX(-50%);
			border-radius: 100%;
			background-color: var(--border-1);
			content: "";
		}
	}

	.step-line-default {
		&::before {
			top: 28px;
		}
	}

	.step-line-last {
		height: 34px;

		&::before {
			top: 32px;
		}
	}

	.code-wrapper {
		display: flex;
		align-items: center;
		align-self: flex-start;
		padding: 6px 6px 6px 8px;
		gap: 10px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
		background-color: var(--bg-1);
		user-select: text;
	}
</style>
