<script lang="ts">
	import newProjectSvg from "$lib/assets/splash-illustrations/new-project.svg?raw";
	import RedirectIfLoggedIn from "$lib/auth/RedirectIfLoggedIn.svelte";
	import OAuthButtons from "$lib/components/auth/OAuthButtons.svelte";
	import PasswordConfirmation from "$lib/components/auth/PasswordConfirmation.svelte";
	import UsernameTextbox from "$lib/components/auth/UsernameTextbox.svelte";
	import FullscreenIllustrationCard from "$lib/components/service/FullscreenIllustrationCard.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button, EmailTextbox, InfoMessage } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	let username = $state<string>();
	let email = $state<string>();
	let password = $state<string>();
	let passwordConfirmation = $state<string>();
	let error = $state<LocalizedText>();
	let successMessage = $state<string>();

	let emailTextbox: any = $state();
	let usernameTextbox: any = $state();
	let passwordComponent: PasswordConfirmation | undefined = $state();

	const isFormValid = $derived(
		username?.trim() &&
			email?.trim() &&
			emailTextbox?.isValid() &&
			usernameTextbox?.isValid() &&
			passwordComponent?.isValid?.(),
	);

	const loginService = inject(LOGIN_SERVICE);
	const routesService = inject(WEB_ROUTES_SERVICE);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!username || !email || !password || !passwordConfirmation) {
			error = i18nMessage("web:detail.90cf035f4a");
			return;
		}

		if (!passwordComponent?.isValid()) {
			error = i18nMessage("web:detail.618966893b");
			return;
		}

		if (!usernameTextbox?.isValid()) {
			error = i18nMessage("web:detail.88aeda3d7f");
			return;
		}

		const response = await loginService.createAccountWithEmail(
			username,
			email,
			password,
			passwordConfirmation,
		);

		if (response.type === "error") {
			error = response.errorMessage;
			console.error("Login failed:", response.raw ?? response.errorMessage);
		} else {
			error = undefined;
			successMessage = response.data.message;
		}
	}
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerSignUp")}</title>
</svelte:head>

<RedirectIfLoggedIn />

<FullscreenIllustrationCard illustration={successMessage ? newProjectSvg : undefined}>
	{#snippet title()}
		{#if !successMessage}
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<i>{@render content()}</i>{/snippet}
			<I18nRichMessage
				value={{ key: "web:page.signUpForGitButler" }}
				components={{ slot1: i18nSlot1 }}
			/>
		{:else}
			{#snippet i18nSlot2(content: import("svelte").Snippet)}<i>{@render content()}</i>{/snippet}
			<I18nRichMessage
				value={{ key: "web:page.checkYourEmailForConfirmationInstructions" }}
				components={{ slot2: i18nSlot2 }}
			/>
		{/if}
	{/snippet}

	{#if !successMessage}
		<form id="signup-form" class="stack-v" onsubmit={handleSubmit}>
			<div class="auth-form__inputs">
				<UsernameTextbox bind:this={usernameTextbox} bind:value={username} />
				<EmailTextbox
					bind:this={emailTextbox}
					label={$i18nMessages.t("web:page.email")}
					placeholder=" "
					bind:value={email}
					autocomplete={false}
					autocorrect={false}
					spellcheck
				/>
				<PasswordConfirmation
					bind:this={passwordComponent}
					bind:password
					bind:passwordConfirmation
				/>
			</div>

			{#if error}
				<InfoMessage filled outlined={false} style="danger" class="m-b-16">
					{#snippet content()}
						{$i18nMessages.text(error ?? "")}
					{/snippet}
				</InfoMessage>
			{/if}

			<Button type="submit" style="pop" disabled={!isFormValid}
				>{$i18nMessages.t("web:page.createAccount")}</Button
			>

			<OAuthButtons mode="signup" />
		</form>
	{/if}

	{#snippet footer()}
		<div class="auth-form__footer">
			{#if !successMessage}
				<p>
					{#snippet i18nSlot3(content: import("svelte").Snippet)}<a
							href="https://gitbutler.com/terms">{@render content()}</a
						>{/snippet}
					{#snippet i18nSlot4(content: import("svelte").Snippet)}<a
							href="https://gitbutler.com/privacy">{@render content()}</a
						>{/snippet}
					<I18nRichMessage
						value={{ key: "web:page.bySigningUpYouAgreeToOurTerms" }}
						components={{ slot3: i18nSlot3, slot4: i18nSlot4 }}
					/>
				</p>
				<p>
					{#snippet i18nSlot5(content: import("svelte").Snippet)}<a href={routesService.loginPath()}
							>{@render content()}</a
						>{/snippet}
					<I18nRichMessage
						value={{ key: "web:page.alreadyHaveAnAccountLogInNow" }}
						components={{ slot5: i18nSlot5 }}
					/>
				</p>
			{:else}
				<p>
					{#snippet i18nSlot6(content: import("svelte").Snippet)}<a
							href="https://github.com/gitbutlerapp/gitbutler/issues/new?template=BLANK_ISSUE"
							target="_blank"
							rel="noopener noreferrer">{@render content()}</a
						>{/snippet}
					<I18nRichMessage
						value={{ key: "web:page.needHelpOpenASupportRequest" }}
						components={{ slot6: i18nSlot6 }}
					/>
				</p>
			{/if}
		</div>
	{/snippet}
</FullscreenIllustrationCard>

<style lang="postcss">
	.auth-form__inputs {
		display: flex;
		flex-direction: column;
		margin-bottom: 24px;
		gap: 14px;
	}

	.auth-form__footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
</style>
