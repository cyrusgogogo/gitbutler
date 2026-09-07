<script lang="ts">
	import { goto } from "$app/navigation";
	import newProjectSvg from "$lib/assets/splash-illustrations/new-project.svg?raw";
	import UsernameTextbox from "$lib/components/auth/UsernameTextbox.svelte";
	import FullscreenIllustrationCard from "$lib/components/service/FullscreenIllustrationCard.svelte";
	import { USER_SERVICE } from "$lib/user/userService";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button, InfoMessage, EmailTextbox } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	const userService = inject(USER_SERVICE);
	const loginService = inject(LOGIN_SERVICE);
	const routesService = inject(WEB_ROUTES_SERVICE);
	const user = userService.user;
	const isLoggedIn = $derived($user !== undefined);
	const userEmail = $derived($user?.email);
	const userLogin = $derived($user?.login);

	const isFinalized = $derived(isLoggedIn && userEmail && userLogin);

	let email = $state<string>();
	let username = $state<string>();

	let emailTextbox: any = $state();
	let usernameTextbox: any = $state();

	let error = $state<LocalizedText>();
	let message = $state<LocalizedText>();
	const effectiveEmail = $derived(email ?? userEmail);
	const effectiveUsername = $derived(username ?? userLogin);
	const canSubmit = $derived(
		!!effectiveEmail &&
			!!effectiveUsername &&
			(!email || emailTextbox?.isValid()) &&
			(!username || usernameTextbox?.isValid()),
	);

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!$user) {
			// should not happen
			error = i18nMessage("web:detail.9ad2df0030");
			return;
		}

		if (!effectiveEmail) {
			error = i18nMessage("web:detail.c79fce0e91");
			return;
		}

		if (!effectiveUsername) {
			error = i18nMessage("web:detail.30fa8890b2");
			return;
		}

		const response = await loginService.finalizeAccount(effectiveEmail, effectiveUsername);
		if (response.type === "error") {
			error = response.errorMessage;
			console.error("Finalize account failed:", response.raw ?? response.errorMessage);
			return;
		}

		error = undefined;
		message = response.data.message;
		await userService.refreshUser();
	}

	$effect(() => {
		if (isFinalized) {
			const timeOut = setTimeout(() => {
				goto(routesService.profilePath());
			}, 3000);

			return () => clearTimeout(timeOut);
		}
	});
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerFinalizeAccount")}</title>
</svelte:head>

<FullscreenIllustrationCard illustration={newProjectSvg}>
	{#snippet title()}
		{#snippet i18nSlot1(content: import("svelte").Snippet)}<i>{@render content()}</i>{/snippet}
		<I18nRichMessage value={{ key: "web:page.almostDone" }} components={{ slot1: i18nSlot1 }} />
	{/snippet}

	<form class="finalize-form__content" onsubmit={handleSubmit}>
		<p class="text-12 text-base finalize-form__caption">
			{$i18nMessages.t("web:page.weNeedTheseDetailsToSetUpYour")}
		</p>
		{#if !userLogin}
			<UsernameTextbox bind:this={usernameTextbox} bind:value={username} />
		{/if}
		{#if !userEmail}
			<EmailTextbox
				bind:this={emailTextbox}
				bind:value={email}
				label={$i18nMessages.t("web:page.email")}
			/>
		{/if}

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

		<Button style="pop" type="submit" disabled={!canSubmit}
			>{$i18nMessages.t("web:page.finalizeAccount")}</Button
		>
	</form>
</FullscreenIllustrationCard>

<style lang="postcss">
	.finalize-form__content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.finalize-form__caption {
		margin-top: -20px;
		margin-bottom: 8px;
		color: var(--text-2);
	}
</style>
