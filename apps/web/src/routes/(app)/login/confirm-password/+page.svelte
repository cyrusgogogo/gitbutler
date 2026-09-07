<script lang="ts">
	import { page } from "$app/state";
	import RedirectIfLoggedIn from "$lib/auth/RedirectIfLoggedIn.svelte";
	import PasswordConfirmation from "$lib/components/auth/PasswordConfirmation.svelte";
	import FullscreenUtilityCard from "$lib/components/service/FullscreenUtilityCard.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button, InfoMessage } from "@gitbutler/ui";
	import { env } from "$env/dynamic/public";
	const i18nMessages = useTranslations();

	const loginService = inject(LOGIN_SERVICE);
	const routesService = inject(WEB_ROUTES_SERVICE);

	let password = $state<string>();
	let passwordConfirmation = $state<string>();
	let error = $state<LocalizedText>();
	let message = $state<LocalizedText>();
	let passwordComponent: PasswordConfirmation | undefined;

	async function handleSubmit() {
		const token = page.url.searchParams.get("t");

		if (!token) {
			error = i18nMessage("web:detail.d836a60449");
			// TODO: Probably redirect to the login page or show a more user-friendly error
			return;
		}

		if (!passwordComponent?.isValid()) {
			error = i18nMessage("web:detail.618966893b");
			return;
		}

		if (!password || !passwordConfirmation) {
			error = i18nMessage("web:detail.da16feed3b");
			return;
		}

		const response = await loginService.confirmPasswordReset(token, password, passwordConfirmation);
		if (response.type === "error") {
			error = response.errorMessage;
			console.error("Confirm password failed:", response.raw ?? response.errorMessage);
			message = "";
			return;
		}

		error = undefined;
		message = response.data.message;
		const url = new URL("successful_login", env.PUBLIC_APP_HOST);
		url.searchParams.set("access_token", encodeURIComponent(response.data.token));
		const path = url.toString();
		window.location.href = path;
	}
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerConfirmPassword")}</title>
</svelte:head>

<RedirectIfLoggedIn />

<FullscreenUtilityCard
	title={$i18nMessages.t("web:page.confirmNewPassword")}
	backlink={{ label: $i18nMessages.t("web:nav.login"), href: routesService.loginPath() }}
>
	<div class="form-content">
		<PasswordConfirmation
			bind:this={passwordComponent}
			bind:password
			bind:passwordConfirmation
			showValidation={true}
		/>

		{#if error}
			<InfoMessage filled outlined={false} style="danger">
				{#snippet content()}
					{$i18nMessages.text(error ?? "")}
				{/snippet}
			</InfoMessage>
		{/if}

		{#if message}
			<InfoMessage filled outlined={false} style="success">
				{#snippet content()}
					{$i18nMessages.text(message ?? "")}
				{/snippet}
			</InfoMessage>
		{/if}

		<Button style="pop" onclick={handleSubmit}>{$i18nMessages.t("web:page.confirmPassword")}</Button
		>
	</div>
</FullscreenUtilityCard>

<style lang="postcss">
	.form-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
