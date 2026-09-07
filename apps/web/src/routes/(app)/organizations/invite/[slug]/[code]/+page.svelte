<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { USER_SERVICE } from "$lib/user/userService";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { ORGANIZATION_SERVICE } from "@gitbutler/shared/organizations/organizationService";
	import { WEB_ROUTES_SERVICE } from "@gitbutler/shared/routing/webRoutes.svelte";
	import { Button } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { env } from "$env/dynamic/public";
	const i18nMessages = useTranslations();

	const userService = inject(USER_SERVICE);
	const organizationService = inject(ORGANIZATION_SERVICE);

	const user = $derived(userService.user);

	// Get the org slug and invite code from the route parameters
	const inviteCode = $derived($page.params.code!);
	const slug = $derived($page.params.slug!);

	// Get services from context
	const routes = inject(WEB_ROUTES_SERVICE);

	// Track the auth and join status
	const isLoggedIn = $derived(!!$user?.id);
	let isJoining = $state(false);
	let joinError = $state<LocalizedText | null>(null);
	let joinSuccess = $state(false);
	let showConfirmation = $state(false);

	// Check auth status and respond accordingly
	// Process the invite when authenticated
	async function processInvite() {
		if (!isLoggedIn) return;

		isJoining = true;
		joinError = null;

		try {
			// Use the organizationService instead of direct fetch
			await organizationService.joinOrganization(slug, inviteCode);

			joinSuccess = true;

			// Redirect to the organization page after successful join
			setTimeout(() => {
				goto(routes.ownerPath({ ownerSlug: slug }));
			}, 1500);
		} catch (error: any) {
			// Try to extract error message from JSON response if available
			let errorMessage: LocalizedText = i18nMessage("web:detail.cdb3a6aaa5");
			try {
				// Check if error has a response with JSON data
				if (error.response && error.response.data) {
					// Extract error message from JSON response
					errorMessage = error.response.data.error || errorMessage;
				} else if (typeof error.message === "string") {
					// Try to parse error message as JSON if it's a string
					const errorJson = JSON.parse(error.message.replace(/^[^{]*/, ""));
					errorMessage = errorJson.error || errorMessage;
				}
			} catch (_) {
				// If JSON parsing fails, use the original error message
				errorMessage = error.message || errorMessage;
			}

			joinError = errorMessage;
			isJoining = false;
		}
	}

	$effect(() => {
		if (browser && isLoggedIn) {
			showConfirmation = true;
		}
	});

	// Handle confirmation to join
	function handleConfirm() {
		processInvite();
	}

	// Handle manual retry
	function handleRetry() {
		processInvite();
	}

	// Navigate to login if not logged in
	function goToLogin() {
		// Store the current URL in session storage to redirect back after login
		if (browser) {
			sessionStorage.setItem("redirectAfterLogin", window.location.href);
		}
		window.location.href = `${env.PUBLIC_APP_HOST}/cloud/login?callback=${window.location.href}`;
	}
</script>

<div class="invite-container">
	<div class="invite-card">
		<h1>{$i18nMessages.t("web:page.organizationInvitation")}</h1>

		{#if !isLoggedIn}
			<p>
				{#snippet i18nSlot1(content: import("svelte").Snippet)}<strong>{@render content()}</strong
					>{/snippet}
				<I18nRichMessage
					value={{ key: "web:page.youVeBeenInvitedToJoinValue", values: { slug: String(slug) } }}
					components={{ slot1: i18nSlot1 }}
				/>
			</p>
			<p>{$i18nMessages.t("web:page.pleaseLogInToContinue")}</p>
			<Button onclick={goToLogin} style="pop">{$i18nMessages.t("web:page.logIn_d527bf3")}</Button>
		{:else if isJoining}
			<div class="loading-container">
				<p>{$i18nMessages.t("web:page.joiningOrganization")}</p>
			</div>
		{:else if joinError}
			<p>{$i18nMessages.text(joinError ?? "")}</p>
			<div class="button-container">
				<Button onclick={handleRetry} style="pop">{$i18nMessages.t("web:page.tryAgain")}</Button>
			</div>
		{:else if joinSuccess}
			<p>{$i18nMessages.t("web:page.youHaveSuccessfullyJoinedTheOrganization")}</p>
			<p>{$i18nMessages.t("web:page.redirectingToTheOrganizationPage")}</p>
		{:else if showConfirmation}
			<p>
				{#snippet i18nSlot2(content: import("svelte").Snippet)}<strong>{@render content()}</strong
					>{/snippet}
				<I18nRichMessage
					value={{
						key: "web:page.youVeBeenInvitedToJoinValue_5394a96",
						values: { slug: String(slug) },
					}}
					components={{ slot2: i18nSlot2 }}
				/>
			</p>
			<p>{$i18nMessages.t("web:page.wouldYouLikeToAcceptThisInvitation")}</p>
			<div class="button-container">
				<Button onclick={handleConfirm} style="pop"
					>{$i18nMessages.t("web:page.joinOrganization")}</Button
				>
			</div>
		{:else}
			<p>{$i18nMessages.t("web:page.processingYourInvitation")}</p>
		{/if}
	</div>
</div>

<style>
	.invite-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		padding: 2rem;
	}

	.invite-card {
		width: 100%;
		max-width: 500px;
		padding: 2rem;
		border-radius: 0.5rem;
		background-color: var(--color-bg-card);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	h1 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.button-container {
		margin-top: 1.5rem;
	}
</style>
