<script lang="ts">
	import SectionCardDisclaimer from "$components/shared/SectionCardDisclaimer.svelte";
	import SettingsSection from "$components/shared/SettingsSection.svelte";
	import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
	import { GIT_SERVICE } from "$lib/git/gitService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		Button,
		CardGroup,
		InfoMessage,
		Link,
		Select,
		SelectItem,
		Textbox,
		Toggle,
	} from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	const { projectId }: { projectId: string } = $props();

	const gitConfig = inject(GIT_CONFIG_SERVICE);
	const gitService = inject(GIT_SERVICE);

	async function setSignCommits(targetState: boolean) {
		signCommits = targetState;
		await gitConfig.setGbConfig(projectId, { signCommits: targetState });
	}

	const signingFormatOptions = $derived([
		{
			label: "GPG",
			value: "openpgp",
			keyPlaceholder: $i18nMessages.t("desktop:CommitSigningForm.staticd74e3fab2"),
			programPlaceholder: $i18nMessages.t("desktop:CommitSigningForm.static58ad627fb"),
		},
		{
			label: "SSH",
			value: "ssh",
			keyPlaceholder: $i18nMessages.t("desktop:CommitSigningForm.static9dd81922f"),
			programPlaceholder: $i18nMessages.t("desktop:CommitSigningForm.static9d4686fd4"),
		},
	] as const);

	const selectedOption = $derived(
		signingFormatOptions.find((option) => option.value === signingFormat),
	);
	const keyPlaceholder = $derived(selectedOption?.keyPlaceholder);
	const programPlaceholder = $derived(selectedOption?.programPlaceholder);

	let checked = $state(false);
	let loading = $state(true);
	let signCheckResult = $state(false);
	let errorMessage = $state("");

	async function checkSigning() {
		errorMessage = "";
		checked = true;
		loading = true;
		await gitService
			.checkSigningSettings(projectId)
			.then(() => {
				signCheckResult = true;
			})
			.catch((err) => {
				console.error("Error checking signing:", err);
				errorMessage = err.message;
				signCheckResult = false;
			});
		loading = false;
	}

	async function updateSigningInfo() {
		let signUpdate = {
			signingFormat: signingFormat,
			signingKey: signingKey,
			gpgProgram: signingFormat === "openpgp" ? signingProgram : "",
			gpgSshProgram: signingFormat === "ssh" ? signingProgram : "",
		};
		await gitConfig.setGbConfig(projectId, signUpdate);
	}

	const gbConfig = $derived(gitConfig.gbConfig(projectId));
	let signCommits = $derived(gbConfig.response?.signCommits ?? false);
	let signingFormat = $derived(gbConfig.response?.signingFormat ?? "openpgp");
	let signingKey = $derived(gbConfig.response?.signingKey ?? "");
	let signingProgram = $derived(
		gbConfig.response
			? signingFormat === "openpgp"
				? (gbConfig.response.gpgProgram ?? "")
				: (gbConfig.response.gpgSshProgram ?? "")
			: "",
	);

	async function handleSignCommitsClick(event: MouseEvent) {
		await setSignCommits((event.target as HTMLInputElement)?.checked);
	}
</script>

<SettingsSection>
	<CardGroup>
		<CardGroup.Item labelFor="signCommits">
			{#snippet title()}
				{$i18nMessages.t("desktop:CommitSigningForm.signCommits")}
			{/snippet}
			{#snippet caption()}
				{#snippet i18nSlot1()}<br />{/snippet}
				{#snippet i18nSlot2()}<code class="code-string">gitbutler.signCommits</code>{/snippet}
				<I18nRichMessage
					value={{ key: "desktop:CommitSigningForm.useGPGOrSSHToSignYourCommits" }}
					components={{ slot1: i18nSlot1, slot2: i18nSlot2 }}
				/>
			{/snippet}
			{#snippet actions()}
				<Toggle id="signCommits" checked={signCommits} onclick={handleSignCommitsClick} />
			{/snippet}
		</CardGroup.Item>
	</CardGroup>
	{#if signCommits}
		<CardGroup>
			<CardGroup.Item>
				<Select
					value={signingFormat}
					options={signingFormatOptions}
					wide
					label={$i18nMessages.t("desktop:CommitSigningForm.signingFormat")}
					onselect={(value: string) => {
						signingFormat = value;
						updateSigningInfo();
					}}
				>
					{#snippet itemSnippet({ item, highlighted })}
						<SelectItem selected={item.value === signingFormat} {highlighted}>
							{item.label}
						</SelectItem>
					{/snippet}
				</Select>

				<Textbox
					label={$i18nMessages.t("desktop:CommitSigningForm.signingKey")}
					bind:value={signingKey}
					required
					onchange={updateSigningInfo}
					placeholder={keyPlaceholder}
				/>

				<Textbox
					label={$i18nMessages.t("desktop:CommitSigningForm.signingProgramOptional")}
					bind:value={signingProgram}
					onchange={updateSigningInfo}
					placeholder={programPlaceholder}
				/>

				{#if checked}
					<InfoMessage
						style={loading ? "info" : signCheckResult ? "success" : "danger"}
						filled
						outlined={false}
						error={errorMessage}
					>
						{#snippet title()}
							{#if loading}
								<p>{$i18nMessages.t("desktop:CommitSigningForm.checkingSigning")}</p>
							{:else if signCheckResult}
								<p>{$i18nMessages.t("desktop:CommitSigningForm.signingIsWorkingCorrectly")}</p>
							{:else}
								<p>{$i18nMessages.t("desktop:CommitSigningForm.signingIsNotWorkingCorrectly")}</p>
							{/if}
						{/snippet}
					</InfoMessage>
				{/if}

				<Button style="pop" wide icon="tick" onclick={checkSigning}>
					{#if !checked}
						{$i18nMessages.t("desktop:CommitSigningForm.testSigning")}
					{:else}
						{$i18nMessages.t("desktop:CommitSigningForm.reTestSigning")}
					{/if}
				</Button>
				<SectionCardDisclaimer>
					{$i18nMessages.t("desktop:CommitSigningForm.signingCommitsCanAllowOtherPeopleToVerify")}
					<Link href="https://docs.gitbutler.com/features/virtual-branches/signing-commits"
						>{$i18nMessages.t("desktop:CommitSigningForm.readMore")}</Link
					>
					{$i18nMessages.t("desktop:CommitSigningForm.aboutCommitSigningAndVerification")}
				</SectionCardDisclaimer>
			</CardGroup.Item>
		</CardGroup>
	{/if}
</SettingsSection>
