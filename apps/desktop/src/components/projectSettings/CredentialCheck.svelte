<script lang="ts">
	import SectionCardDisclaimer from "$components/shared/SectionCardDisclaimer.svelte";
	import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
	import { parseError } from "$lib/error/parser";

	import { inject } from "@gitbutler/core/context";
	import { message, type LocalizedText } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Icon, InfoMessage, Link } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { slide } from "svelte/transition";
	const i18nMessages = useTranslations();

	interface Props {
		projectId: string;
		disabled: boolean;
		remoteName: string | null | undefined;
		branchName: string | null | undefined;
	}

	const { projectId, remoteName, branchName, disabled }: Props = $props();

	const gitConfig = inject(GIT_CONFIG_SERVICE);

	type Check = { name: LocalizedText; promise: Promise<any> };
	let checks = $state<Check[]>();

	let errors = $state(0);

	let loading = $state(false);

	async function checkCredentials() {
		if (!remoteName || !branchName) return;

		loading = true;
		errors = 0;
		checks = [];

		try {
			const fetchCheck = gitConfig.checkGitFetch(projectId, remoteName);
			checks = [{ name: message("desktop:CredentialCheck.detaild48aafe68"), promise: fetchCheck }];
			await fetchCheck;
			const pushCheck = gitConfig.checkGitPush(projectId, remoteName, branchName);
			checks = [
				...checks,
				{ name: message("desktop:CredentialCheck.detail8f7f57b51"), promise: pushCheck },
			];
			await pushCheck;
		} catch {
			errors = 1;
		} finally {
			loading = false;
		}
	}

	export function reset() {
		checks = [];
	}
</script>

<div class="credential-check">
	{#if checks && checks.length > 0}
		<div transition:slide={{ duration: 250 }}>
			<InfoMessage
				style={errors > 0 ? "warning" : loading ? "info" : "success"}
				filled
				outlined={false}
			>
				{#snippet title()}
					{#if loading}
						{$i18nMessages.t("desktop:CredentialCheck.checkingGitCredentials")}
					{:else if errors > 0}
						{$i18nMessages.t("desktop:CredentialCheck.thereWasAProblemWithYourCredentials")}
					{:else}
						{$i18nMessages.t("desktop:CredentialCheck.allChecksPassedSuccessfully")}
					{/if}
				{/snippet}

				{#snippet content()}
					<div class="checks-list" transition:slide={{ duration: 250, delay: 1000 }}>
						{#if checks}
							{#each checks as check}
								<div class="text-12 text-body check-result">
									<i class="check-icon">
										{#await check.promise}
											<Icon name="spinner" size={14} />
										{:then}
											<Icon name="tick" size={14} />
										{:catch}
											<Icon name="danger" size={14} />
										{/await}
									</i>{$i18nMessages.text(check.name)}

									{#await check.promise catch err}
										- {parseError(err).message}
									{/await}
								</div>
							{/each}
						{/if}
					</div>

					{#if errors > 0}
						<div class="text-12 text-body help-text" transition:slide>
							<span>
								{#snippet i18nSlot1()}<br />{/snippet}
								<I18nRichMessage
									value={{ key: "desktop:CredentialCheck.tryAnotherSettingAndTestAgainConsultOur" }}
									components={{ slot1: i18nSlot1 }}
								/>
								<Link href="https://docs.gitbutler.com/troubleshooting/fetch-push">
									{$i18nMessages.t("desktop:CredentialCheck.fetchPushGuide")}
								</Link>
								{$i18nMessages.t("desktop:CredentialCheck.forHelpFixingThisProblem")}
							</span>
						</div>
					{/if}
				{/snippet}
			</InfoMessage>
		</div>
	{/if}
	<Button style="pop" wide icon="tick" {loading} {disabled} onclick={checkCredentials}>
		{#if loading || checks?.length === 0}
			{$i18nMessages.t("desktop:CredentialCheck.testCredentials")}
		{:else}
			{$i18nMessages.t("desktop:CredentialCheck.reTestCredentials")}
		{/if}
	</Button>
	<SectionCardDisclaimer>
		{$i18nMessages.t("desktop:CredentialCheck.toTestThePushCommandWeCreateAn")}
		<Link href="https://docs.gitbutler.com/troubleshooting/fetch-push"
			>{$i18nMessages.t("desktop:CredentialCheck.readMore")}</Link
		>
		{$i18nMessages.t("desktop:CredentialCheck.aboutAuthenticationMethods")}
	</SectionCardDisclaimer>
</div>

<style>
	.credential-check {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.checks-list {
		display: flex;
		flex-direction: column;
		margin-top: 4px;
		gap: 4px;
	}

	.check-icon {
		display: flex;
	}

	.check-result {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.help-text {
		margin-top: 6px;
	}
</style>
