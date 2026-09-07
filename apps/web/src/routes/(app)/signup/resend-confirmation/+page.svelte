<script lang="ts">
	import { page } from "$app/state";
	import FullscreenUtilityCard from "$lib/components/service/FullscreenUtilityCard.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button, InfoMessage, EmailTextbox } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	let error = $state<LocalizedText>();
	let message = $state<LocalizedText>();

	let emailTextbox: any = $state();

	const loginService = inject(LOGIN_SERVICE);
	const routesService = inject(WEB_ROUTES_SERVICE);

	const email = $derived(page.url.searchParams.get("email"));
	const messageCode = $derived(page.url.searchParams.get("message_code"));
	const banner = $derived(
		messageCode === "invalid_or_expired_token"
			? $i18nMessages.t("web:detail.4eec772d51")
			: undefined,
	);

	let inputEmail = $state<string>();

	const emailToSendTo = $derived(inputEmail ?? email ?? undefined);
	const isValidEmail = $derived(email ? true : !inputEmail || emailTextbox?.isValid());
	const canSubmit = $derived(!!emailToSendTo && isValidEmail);

	async function resendConfirmationEmail() {
		if (!emailToSendTo) {
			error = i18nMessage("web:detail.6fe3a38166");
			return;
		}
		const response = await loginService.resendConfirmationEmail(emailToSendTo);
		if (response.type === "error") {
			error = response.errorMessage;
			console.error("Failed to resend confirmation email:", response.raw ?? response.errorMessage);
		} else {
			message = i18nMessage("web:detail.59c5a20dcb");
		}
	}
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerResendConfirmation")}</title>
</svelte:head>

<FullscreenUtilityCard
	title={$i18nMessages.t("web:page.resendConfirmation")}
	backlink={{ label: $i18nMessages.t("web:nav.login"), href: routesService.loginPath() }}
>
	{#if email}
		<p class="text-13 text-body">
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<i class="clr-text-2"
					>{@render content()}</i
				>{/snippet}
			<I18nRichMessage
				value={{
					key: "web:page.weSendAConfirmationEmailToValue",
					values: { email: String(email) },
				}}
				components={{ slot1: i18nSlot1 }}
			/>
		</p>
	{:else}
		<div class="stack-v gap-16">
			<EmailTextbox
				bind:this={emailTextbox}
				bind:value={inputEmail}
				label={$i18nMessages.t("web:page.email")}
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

			{#if banner}
				<InfoMessage filled outlined={false} style="warning">
					{#snippet content()}
						{banner}
					{/snippet}
				</InfoMessage>
			{/if}

			<Button style="pop" disabled={!canSubmit} onclick={resendConfirmationEmail}
				>{$i18nMessages.t("web:page.resendConfirmationEmail")}</Button
			>
		</div>
	{/if}
</FullscreenUtilityCard>
