<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import FullscreenUtilityCard from "$lib/components/service/FullscreenUtilityCard.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import { AsyncButton, Button, chipToasts } from "@gitbutler/ui";
	import { copyToClipboard } from "@gitbutler/ui/utils/clipboard";
	const i18nMessages = useTranslations();

	const loginService = inject(LOGIN_SERVICE);
	const BUILD_TYPE_PARAM = "bt";

	const searchParams = $derived(page.url.searchParams);
	const buildType = $derived(mapBuiltType(searchParams.get(BUILD_TYPE_PARAM)));

	async function copyAccessToken() {
		const response = await loginService.token();
		if (response.type === "success" && response.data) {
			copyToClipboard(response.data);
		} else {
			chipToasts.error(i18nMessage("web:page.failedToGetToken"));
		}
	}

	function mapBuiltType(buildType: string | null): "but" | "but-nightly" | null {
		switch (buildType) {
			case "release":
				return "but";
			case "nightly":
				return "but-nightly";
			default:
				return null;
		}
	}

	async function followDeeplink() {
		if (!buildType) {
			chipToasts.error(i18nMessage("web:page.unknownBuiltType"));
			return;
		}

		const response = await loginService.token();
		if (response.type !== "success" || !response.data) {
			chipToasts.error(i18nMessage("web:page.failedToGetToken"));
		} else {
			const accessToken = response.data;
			const deeplink = `${buildType}://login?access_token=${accessToken}&t=${Date.now()}`;
			window.location.href = deeplink;
		}
	}
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerLoggedIn")}</title>
</svelte:head>

<FullscreenUtilityCard
	title={$i18nMessages.t("web:page.signedInSuccessfully")}
	backlink={{
		label: $i18nMessages.t("web:page.inline62bce9422"),
		href: "/",
	}}
>
	<div class="loggedin__success-card-content">
		{#if buildType !== null}
			<p class="text-13">{$i18nMessages.t("web:page.clickBelowToOpenYourClientAndComplete")}</p>
		{:else}
			<p class="text-13">{$i18nMessages.t("web:page.copyTheAccessTokenAndPasteItIn")}</p>
		{/if}
		<div class="flex gap-8 m-t-8">
			{#if buildType !== null}
				<AsyncButton style="gray" kind="outline" icon="open-in-ide" action={followDeeplink}
					>{$i18nMessages.t("web:page.openClient")}</AsyncButton
				>
			{:else}
				<AsyncButton style="gray" kind="outline" icon="copy" action={copyAccessToken}
					>{$i18nMessages.t("web:page.copyAccessToken")}</AsyncButton
				>
			{/if}
			<Button style="gray" kind="ghost" onclick={() => goto("/profile")} icon="user"
				>{$i18nMessages.t("web:page.profilePage")}</Button
			>
		</div>
	</div>
</FullscreenUtilityCard>

<style>
	.loggedin__success-card-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
