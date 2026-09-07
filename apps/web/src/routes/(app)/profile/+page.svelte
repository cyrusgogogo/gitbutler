<script lang="ts">
	import ExperimentalSettings from "./components/ExperimentalSettings.svelte";
	import NotificationSettings from "./components/NotificationSettings.svelte";
	import ProfileHeader from "./components/ProfileHeader.svelte";
	import SupporterCard from "./components/SupporterCard.svelte";
	import linksJson from "$lib/data/links.json";
	import { USER_SERVICE } from "$lib/user/userService";
	import { getOS } from "$lib/utils/getOS";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { LOGIN_SERVICE } from "@gitbutler/shared/login/loginService";
	import Loading from "@gitbutler/shared/network/Loading.svelte";
	import { getRecentlyPushedProjects } from "@gitbutler/shared/organizations/projectsPreview.svelte";
	import { APP_STATE } from "@gitbutler/shared/redux/store.svelte";
	import { NOTIFICATION_SETTINGS_SERVICE } from "@gitbutler/shared/settings/notificationSettingsService";
	import { getNotificationSettingsInterest } from "@gitbutler/shared/settings/notificationSetttingsPreview.svelte";
	import { Button, CardGroup, chipToasts, Icon, Modal, Spacer } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { copyToClipboard } from "@gitbutler/ui/utils/clipboard";
	import { env } from "$env/dynamic/public";
	const i18nMessages = useTranslations();

	const userService = inject(USER_SERVICE);
	const appState = inject(APP_STATE);
	const notificationSettingsService = inject(NOTIFICATION_SETTINGS_SERVICE);
	const recentProjects = getRecentlyPushedProjects();
	const loginService = inject(LOGIN_SERVICE);

	const notificationSettings = getNotificationSettingsInterest(
		appState,
		notificationSettingsService,
	);

	const user = $derived(userService.user);

	const detectedOS = $derived.by(() => {
		const os = getOS();
		return os === "unknown" ? "macOS" : os;
	});

	const downloadButtonText = $derived(
		$i18nMessages.t("web:detail.629c268d33", { value1: String(detectedOS) }),
	);

	const downloadLink = $derived.by(() => {
		switch (detectedOS) {
			case "Windows":
				return linksJson.downloads.windowsMsi.url;
			case "Linux":
				return linksJson.downloads.linuxAppimage.url;
			case "macOS":
			default:
				return linksJson.downloads.appleSilicon.url;
		}
	});

	async function refreshAccessToken() {
		await userService.refreshAccessToken();
		chipToasts.success(i18nMessage("web:page.accessTokenRefreshedSuccessfully"));
	}

	function logout() {
		window.location.href = `${env.PUBLIC_APP_HOST}cloud/logout`;
	}

	let deleteAccountConfirmationModal = $state<Modal>();

	function initiateDeleteAccount() {
		deleteAccountConfirmationModal?.show();
	}

	async function deleteAccount() {
		await userService.deleteAccount();
		logout();
	}

	async function copyAccessToken() {
		const response = await loginService.token();
		if (response.type === "success" && response.data) {
			copyToClipboard(response.data);
		} else {
			chipToasts.error(i18nMessage("web:page.failedToGetToken"));
		}
	}
</script>

<svelte:head>
	<title>{$i18nMessages.t("web:page.gitButlerUser")}</title>
</svelte:head>

{#if !$user?.id}
	<div class="not-logged-in">
		<h3 class="text-18 text-bold">{$i18nMessages.t("web:page.itLooksLikeYouReNotLoggedIn")}</h3>
		<p class="text-14 text-body clr-text-2">
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<a class="underline" href="/login"
					>{@render content()}</a
				>{/snippet}
			<I18nRichMessage
				value={{ key: "web:page.pleaseLogInToAccessYourProfile" }}
				components={{ slot1: i18nSlot1 }}
			/>
		</p>
	</div>
{:else}
	<div class="profile__content">
		<div class="profile__fields">
			<ProfileHeader user={$user} {userService} />

			{#if recentProjects.current.length > 0}
				<Loading loadable={notificationSettings.current}>
					{#snippet children(notificationSettings)}
						<NotificationSettings {notificationSettings} {notificationSettingsService} />
					{/snippet}
				</Loading>

				<ExperimentalSettings />

				<Spacer />
			{/if}

			{#if $user}
				<CardGroup.Item standalone>
					{#snippet title()}
						{$i18nMessages.t("web:page.signingOut")}
					{/snippet}
					{#snippet caption()}
						{$i18nMessages.t("web:page.readyToTakeABreakClickHereTo")}
					{/snippet}
					{#snippet actions()}
						<Button kind="outline" icon="logout" onclick={logout}
							>{$i18nMessages.t("web:page.logOut")}</Button
						>
					{/snippet}
				</CardGroup.Item>

				<CardGroup>
					<CardGroup.Item>
						{#snippet title()}
							{$i18nMessages.t("web:page.accessToken")}
						{/snippet}
						{#snippet caption()}
							{#snippet i18nSlot2()}<br />{/snippet}
							<I18nRichMessage
								value={{ key: "web:page.yourAccessTokenIsUsedToAuthenticateThe" }}
								components={{ slot2: i18nSlot2 }}
							/>
						{/snippet}
					</CardGroup.Item>
					<CardGroup.Item alignment="center">
						{#snippet caption()}
							{$i18nMessages.t("web:page.copyYourTokenToUseWithTheDesktop")}
						{/snippet}
						{#snippet actions()}
							<Button kind="outline" icon="copy" onclick={copyAccessToken}
								>{$i18nMessages.t("web:page.copyToken")}</Button
							>
						{/snippet}
					</CardGroup.Item>
					<CardGroup.Item>
						{#snippet caption()}
							{#snippet i18nSlot3()}<br />{/snippet}
							<I18nRichMessage
								value={{ key: "web:page.refreshYourTokenIfYouNoticeUnusualActivity" }}
								components={{ slot3: i18nSlot3 }}
							/>
						{/snippet}
						{#snippet actions()}
							<Button kind="outline" icon="refresh" onclick={refreshAccessToken}
								>{$i18nMessages.t("web:page.refreshToken")}</Button
							>
						{/snippet}
					</CardGroup.Item>
				</CardGroup>

				<Spacer />

				<CardGroup>
					<CardGroup.Item>
						{#snippet title()}
							{$i18nMessages.t("web:page.dangerZone")}
						{/snippet}
					</CardGroup.Item>
					<CardGroup.Item>
						{#snippet caption()}
							{#snippet i18nSlot4()}<br />{/snippet}
							<I18nRichMessage
								value={{ key: "web:page.permanentlyDeleteYourAccountAndAllDataThis" }}
								components={{ slot4: i18nSlot4 }}
							/>
						{/snippet}
						{#snippet actions()}
							<Button style="danger" onclick={initiateDeleteAccount}
								>{$i18nMessages.t("web:page.deleteMyAccount")}</Button
							>
						{/snippet}
					</CardGroup.Item>
				</CardGroup>
			{/if}
		</div>

		<div class="profile__side">
			<div class="profile_mobile-separator">
				<Spacer />
			</div>

			<div class="download-app-banner">
				<div class="download-card">
					<div class="download-card__header">
						<img class="download-card__icon" src="/images/app-icon.svg" alt="" />

						<p class="text-12 text-body clr-text-2 text-balance">
							{$i18nMessages.t("web:page.getTheDesktopAppForMacWindowsAnd")}
						</p>
					</div>

					<Button style="gray" wide onclick={() => window.open(downloadLink, "_blank")}>
						{downloadButtonText}
					</Button>

					<hr class="download-card__divider" />

					<p class="download-card__other-text text-12">
						{#snippet i18nSlot5(content: import("svelte").Snippet)}<a
								href={linksJson.resources.downloads.url}
								target="_self"
								rel="noopener noreferrer">{@render content()}</a
							>{/snippet}
						<I18nRichMessage
							value={{ key: "web:page.getTheAppForOtherPlatforms" }}
							components={{ slot5: i18nSlot5 }}
						/>
					</p>
				</div>
			</div>

			{#if $user?.supporter}
				<SupporterCard />
			{/if}

			<div class="tips-section">
				<a
					class="tip-link"
					href={linksJson.resources.documentation.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					<div class="tip-link__title">
						<Icon name="docs" color="var(--text-2)" />
						<h3 class="text-14 text-semibold">{$i18nMessages.t("web:page.getStarted")}</h3>
					</div>
					<p class="text-12 text-body clr-text-2">
						{$i18nMessages.t("web:page.exploreComprehensiveGuidesAndBestPractices")}
					</p>

					<span class="tip-link__arrow-icon">↗</span>
				</a>
				<a
					class="tip-link"
					href={linksJson.social.discord.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					<div class="tip-link__title">
						<Icon name="discord" color="var(--text-2)" />
						<h3 class="text-14 text-semibold">{$i18nMessages.t("web:page.joinTheCommunity")}</h3>
					</div>
					<p class="text-12 text-body clr-text-2">
						{$i18nMessages.t("web:page.joinOurDiscordForHelpAndDiscussion")}
					</p>

					<span class="tip-link__arrow-icon">↗</span>
				</a>
				<a class="tip-link" href={linksJson.other.support.url}>
					<div class="tip-link__title">
						<Icon name="chat" color="var(--text-2)" />
						<h3 class="text-14 text-semibold">{$i18nMessages.t("web:page.needHelp")}</h3>
					</div>
					<p class="text-12 text-body clr-text-2">
						{$i18nMessages.t("web:page.createAnIssueOnGitHubWeReHere")}
					</p>

					<span class="tip-link__arrow-icon">↗</span>
				</a>
			</div>
		</div>
	</div>
{/if}

<Modal
	bind:this={deleteAccountConfirmationModal}
	title={$i18nMessages.t("web:page.confirmAccountDeletion")}
	width="small"
>
	<p class="text-13 text-body">
		{#snippet i18nSlot6()}<br />{/snippet}
		{#snippet i18nSlot7(content: import("svelte").Snippet)}<b>{@render content()}</b>{/snippet}
		<I18nRichMessage
			value={{ key: "web:page.areYouSureYouWantToDeleteYour" }}
			components={{ slot6: i18nSlot6, slot7: i18nSlot7 }}
		/>
	</p>
	{#snippet controls(close)}
		<div class="flex flex-row gap-8 justify-end">
			<Button style="pop" onclick={close}>{$i18nMessages.t("web:page.cancel")}</Button>
			<Button style="danger" icon="bin" kind="outline" onclick={deleteAccount}
				>{$i18nMessages.t("web:page.deletePermanently")}</Button
			>
		</div>
	{/snippet}
</Modal>

<style lang="postcss">
	.not-logged-in {
		display: flex;
		row-gap: 10px;
		grid-column: full-start / full-end;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100%;
		text-align: center;
	}

	.profile__content {
		display: grid;
		grid-template-columns: subgrid;
		row-gap: 16px;
		grid-column: full-start / full-end;
		align-self: flex-start;
	}

	.profile__fields {
		display: grid;
		row-gap: 16px;
		grid-column: narrow-start / -6;
	}

	.profile__side {
		display: flex;
		row-gap: 16px;
		grid-column: -6 / narrow-end;
		flex-direction: column;
		align-items: end;
	}

	.tips-section {
		display: flex;
		flex-direction: column;
		width: 100%;
		overflow: hidden;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-ml);
	}

	.tip-link {
		display: flex;
		position: relative;
		flex-direction: column;
		padding: 16px;
		gap: 6px;
		border-bottom: 1px solid var(--border-2);
		background-color: var(--bg-1);
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);

		&:last-child {
			border-bottom: none;
		}

		&:hover {
			background-color: var(--hover-bg-1);

			& .tip-link__arrow-icon {
				transform: translateX(0);
				opacity: 1;
			}
		}
	}

	.tip-link__title {
		display: flex;
		align-items: center;
		margin-bottom: 4px;
		gap: 8px;
	}

	.tip-link__arrow-icon {
		position: absolute;
		top: 8px;
		right: 10px;
		transform: translateX(-2px);
		color: var(--text-2);
		font-size: 16px;
		opacity: 0;
		transition:
			opacity var(--transition-fast),
			color var(--transition-fast),
			transform var(--transition-medium);
	}

	.profile_mobile-separator {
		display: none;
		width: 100%;
	}

	.download-app-banner {
		width: 100%;
	}

	.download-card {
		display: flex;
		flex-direction: column;
		padding: 16px;
		gap: 16px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-ml);
		background-color: var(--bg-1);
	}

	.download-card__header {
		display: flex;
		gap: 12px;
	}

	.download-card__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: var(--radius-m);
		background-color: var(--bg-pop);
	}

	.download-card__other-text {
		color: var(--text-2);
		text-align: center;
		transition: color var(--transition-fast);

		& a {
			text-decoration: underline;

			&:hover {
				color: var(--text-1);
				text-decoration: underline wavy var(--fill-pop-bg);
			}
		}
	}

	.download-card__divider {
		width: 100%;
		height: 1px;
		border: none;
		background: repeating-linear-gradient(
			to right,
			var(--border-2),
			var(--border-2) 2px,
			transparent 2px,
			transparent 4px
		);
	}

	@media (--tablet-viewport) {
		.profile__fields {
			grid-column: full-start / -5;
		}

		.profile__side {
			grid-column: -5 / full-end;
			align-items: center;
		}
	}

	@media (--mobile-viewport) {
		.profile__fields {
			grid-column: full-start / full-end;
		}

		.profile__side {
			grid-column: full-start / full-end;
			align-items: center;
		}

		.profile_mobile-separator {
			display: block;
		}

		.download-card {
			align-items: center;
		}

		.download-card__header {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
	}
</style>
