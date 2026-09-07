<script lang="ts">
	import BitbucketUserLoginState from "$components/settings/BitbucketUserLoginState.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import bitbucketLogoSvg from "$lib/assets/unsized-logos/bitbucket.svg?raw";
	import { BITBUCKET_USER_SERVICE } from "$lib/forge/bitbucket/bitbucketUserService.svelte";
	import { OnboardingEvent, POSTHOG_WRAPPER } from "$lib/telemetry/posthog";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { AddForgeAccountButton, Button, CardGroup, Link, Textbox } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { fade } from "svelte/transition";
	const i18nMessages = useTranslations();

	const bitbucketUserService = inject(BITBUCKET_USER_SERVICE);
	const posthog = inject(POSTHOG_WRAPPER);

	const [clearAll, clearingAllResult] = bitbucketUserService.deleteAllBitbucketAccounts();
	const [storeApiToken, storeApiTokenResult] = bitbucketUserService.storeBitbucketApiToken;
	const accounts = bitbucketUserService.accounts();

	let showingFlow = $state<"apiToken">();

	let emailInput = $state<string>();
	let tokenInput = $state<string>();
	let emailError = $state<string>();
	let tokenError = $state<string>();

	function cleanupApiTokenFlow() {
		showingFlow = undefined;
		emailInput = undefined;
		tokenInput = undefined;
		emailError = undefined;
		tokenError = undefined;
	}

	async function deleteAllBitbucketAccounts() {
		await clearAll();
		startApiTokenFlow();
	}

	function startApiTokenFlow() {
		showingFlow = "apiToken";
	}

	async function storeBitbucketApiToken() {
		if (!emailInput || !tokenInput) return;
		emailError = undefined;
		tokenError = undefined;
		try {
			await storeApiToken({ email: emailInput, accessToken: tokenInput });
			posthog.captureOnboarding(OnboardingEvent.BitbucketStoreApiToken);
			cleanupApiTokenFlow();
		} catch (err: any) {
			console.error("Failed to store Bitbucket API token:", err);
			const message = String(err?.message ?? err);
			tokenError =
				message.includes("403") || message.includes("Forbidden")
					? "Token is missing required scopes - make sure read:user:bitbucket is granted."
					: "Invalid email/token or network error";
			posthog.captureOnboarding(OnboardingEvent.BitbucketStoreApiTokenFailed);
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
						{$i18nMessages.t("desktop:BitbucketIntegration.failedToLoadBitbucketAccounts")}
					{/snippet}
					<Button
						style="pop"
						onclick={deleteAllBitbucketAccounts}
						loading={clearingAllResult.current.isLoading}
						>{$i18nMessages.t("desktop:BitbucketIntegration.tryAgain")}</Button
					>
				</CardGroup.Item>
			{/snippet}

			<!-- ADD ACCOUNT(S) LIST -->
			{#snippet children(accounts)}
				{@const noAccounts = accounts.length === 0}
				{#each accounts as account}
					<BitbucketUserLoginState {account} />
				{/each}

				<CardGroup.Item background={accounts.length > 0 ? "var(--bg-2)" : undefined}>
					{#snippet iconSide()}
						<div class="icon-wrapper__logo">
							{@html bitbucketLogoSvg}
						</div>
					{/snippet}

					{#snippet title()}
						Bitbucket
					{/snippet}

					{#snippet caption()}
						{$i18nMessages.t("desktop:BitbucketIntegration.allowsYouToCreatePullRequests")}
					{/snippet}

					{#snippet actions()}
						{@render addProfileButton(noAccounts)}
					{/snippet}
				</CardGroup.Item>
			{/snippet}
		</ReduxResult>
	</CardGroup>

	<!-- API TOKEN FLOW -->
	{#if showingFlow === "apiToken"}
		<div in:fade={{ duration: 100 }}>
			<CardGroup>
				<CardGroup.Item>
					{#snippet title()}
						{$i18nMessages.t("desktop:BitbucketIntegration.addAtlassianAPIToken")}
					{/snippet}

					{#snippet caption()}
						{#snippet i18nSlot1()}<br />{/snippet}
						<I18nRichMessage
							value={{
								key: "desktop:BitbucketIntegration.requiresReadUserBitbucketReadRepositoryBitbucketRead",
							}}
							components={{ slot1: i18nSlot1 }}
						/>
						<Link href="https://id.atlassian.com/manage-profile/security/api-tokens"
							>{$i18nMessages.t("desktop:BitbucketIntegration.createOneOnIdAtlassianCom")}</Link
						>
					{/snippet}

					<Textbox
						label={$i18nMessages.t("desktop:BitbucketIntegration.atlassianAccountEmail")}
						size="large"
						value={emailInput}
						placeholder={$i18nMessages.t("desktop:BitbucketIntegration.youExampleCom")}
						oninput={(value) => (emailInput = value)}
						error={emailError}
					/>
					<Textbox
						label={$i18nMessages.t("desktop:BitbucketIntegration.aPIToken")}
						size="large"
						type="password"
						value={tokenInput}
						placeholder={$i18nMessages.t("desktop:BitbucketIntegration.aTATT")}
						oninput={(value) => (tokenInput = value)}
						error={tokenError}
					/>
				</CardGroup.Item>
				<CardGroup.Item>
					<div class="flex justify-end gap-6">
						<Button style="gray" kind="outline" onclick={cleanupApiTokenFlow}
							>{$i18nMessages.t("desktop:BitbucketIntegration.cancel")}</Button
						>
						<Button
							style="pop"
							disabled={!emailInput || !tokenInput}
							loading={storeApiTokenResult.current.isLoading}
							onclick={storeBitbucketApiToken}
						>
							{$i18nMessages.t("desktop:BitbucketIntegration.addAccount")}
						</Button>
					</div>
				</CardGroup.Item>
			</CardGroup>
		</div>
	{/if}
</div>

<p class="text-12 text-body bitbucket-integration-settings__text">
	{$i18nMessages.t("desktop:BitbucketIntegration.credentialsArePersistedLocallyInYourOSKeychain")}
</p>

{#snippet addProfileButton(noAccounts: boolean)}
	<AddForgeAccountButton
		{noAccounts}
		disabled={showingFlow !== undefined}
		loading={storeApiTokenResult.current.isLoading}
		menuItems={[
			{
				label: $i18nMessages.t("desktop:BitbucketIntegration.inlinec34fdb060"),
				icon: "lock-auth",
				onclick: startApiTokenFlow,
			},
		]}
	/>
{/snippet}

<style lang="postcss">
	.icon-wrapper__logo {
		width: 28px;
		height: 28px;
	}

	.bitbucket-integration-settings__text {
		color: var(--text-2);
	}
</style>
