<script lang="ts">
	import RedirectIfLoggedIn from "$lib/auth/RedirectIfLoggedIn.svelte";
	import FullscreenUtilityCard from "$lib/components/service/FullscreenUtilityCard.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button, EmailTextbox, InfoMessage } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	const loginService = inject(LOGIN_SERVICE);
	const routesService = inject(WEB_ROUTES_SERVICE);

	let email = $state<string>();
	let emailTextbox: any = $state();
	let error = $state<LocalizedText>();
	let isLinkSent = $state<boolean>(false);
	let sentToEmail = $state<string>();

	const canSubmit = $derived(!!email && emailTextbox?.isValid());

	async function handleSubmit() {
		if (!email) {
			error = i18nMessage("web:detail.4da1d591c4");
			return;
		}

		const response = await loginService.resetPassword(email);
		if (response.type === "error") {
			error = response.errorMessage;
			console.error("Reset password failed:", response.raw ?? response.errorMessage);
		} else {
			error = undefined;
			sentToEmail = email;
			isLinkSent = true;
		}
	}
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerForgotPassword")}</title>
</svelte:head>

<RedirectIfLoggedIn />

<FullscreenUtilityCard
	title={isLinkSent
		? $i18nMessages.t("web:page.inline8fe2f6cc9")
		: $i18nMessages.t("web:page.inline4c29f7f03")}
	backlink={{ label: $i18nMessages.t("web:nav.login"), href: routesService.loginPath() }}
>
	{#if isLinkSent}
		<p class="text-13 text-body">
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<i class="clr-text-2"
					>{@render content()}</i
				>{/snippet}
			{#snippet i18nSlot2()}<br />{/snippet}
			<I18nRichMessage
				value={{
					key: "web:page.weVeSentAPasswordResetLinkTo",
					values: { sentToEmail: String(sentToEmail) },
				}}
				components={{ slot1: i18nSlot1, slot2: i18nSlot2 }}
			/>
		</p>
	{:else}
		<div class="service-form__inputs">
			<EmailTextbox
				bind:this={emailTextbox}
				bind:value={email}
				label={$i18nMessages.t("web:page.email")}
			/>

			{#if error}
				<InfoMessage filled outlined={false} style="danger">
					{#snippet content()}
						{$i18nMessages.text(error ?? "")}
					{/snippet}
				</InfoMessage>
			{/if}

			<Button style="pop" disabled={!canSubmit} onclick={handleSubmit}
				>{$i18nMessages.t("web:page.sendAResetLink")}</Button
			>
		</div>
	{/if}
</FullscreenUtilityCard>

<style lang="postcss">
	.service-form__inputs {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
