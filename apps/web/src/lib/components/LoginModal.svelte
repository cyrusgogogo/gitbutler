<script lang="ts">
	import loginSvg from "$lib/assets/login-modal.svg?raw";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal } from "@gitbutler/ui";
	import { type Snippet } from "svelte";
	import { env } from "$env/dynamic/public";
	const i18nMessages = useTranslations();

	let modal: ReturnType<typeof Modal> | undefined = $state();

	interface Props {
		children?: Snippet;
	}

	const { children }: Props = $props();

	export function show() {
		modal?.show();
	}

	function login() {
		window.location.href = `${env.PUBLIC_APP_HOST}/cloud/login?callback=${window.location.href}`;
	}
</script>

<Modal bind:this={modal} noPadding closeButton width={550}>
	<div class="login-modal">
		<div class="login-modal__illustration">
			{@html loginSvg}
		</div>
		<div class="login-modal__content">
			<h2 class="text-18 text-bold login-modal__title">
				{$i18nMessages.t("web:LoginModal.logInToContinue")}
			</h2>
			<p class="text-13 text-body login-modal__text">
				{#if children}
					{@render children()}
				{:else}
					{$i18nMessages.t("web:LoginModal.youNeedToBeLoggedInToUnlock")}
				{/if}
			</p>

			<div class="login-modal__actions">
				<Button style="pop" onclick={login}>{$i18nMessages.t("web:LoginModal.logIn")}</Button>
				<Button kind="outline" onclick={login}>{$i18nMessages.t("web:LoginModal.signUp")}</Button>
			</div>
		</div>
	</div>
</Modal>

<style lang="postcss">
	.login-modal {
		display: flex;
	}

	.login-modal__illustration {
		width: 240px;
		height: 300px;
		background-color: var(--art-scene-bg);

		@media (--tablet-viewport) {
			display: none;
		}
	}

	.login-modal__content {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		padding: 30px;
	}

	.login-modal__title {
		margin-bottom: 16px;
	}

	.login-modal__text {
		margin-bottom: 30px;
	}

	.login-modal__actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
