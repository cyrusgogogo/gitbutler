<script lang="ts">
	import { GIT_SERVICE } from "$lib/git/gitService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { TestId, ModalHeader, ModalFooter, Textbox, EmailTextbox, Button } from "@gitbutler/ui";
	import { untrack } from "svelte";
	import type { AuthorMissingModalState } from "$lib/state/uiState.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		data: AuthorMissingModalState;
		close: () => void;
	};

	const { data, close }: Props = $props();

	const gitService = inject(GIT_SERVICE);
	const [setAuthorInfo, settingInfo] = gitService.setAuthorInfo;

	let name = $state(untrack(() => data.authorName));
	let email = $state(untrack(() => data.authorEmail));
	let emailTextbox: any;

	async function handleSubmit() {
		if (!name || !email) {
			return;
		}
		if (!emailTextbox.isValid()) {
			emailTextbox.validate();
			return;
		}
		await setAuthorInfo({
			projectId: data.projectId,
			name,
			email,
		});
		close();
	}
</script>

<ModalHeader type="warning"
	>{$i18nMessages.t("desktop:AuthorMissingModalContent.setUpYourGitAuthorInformation")}</ModalHeader
>
<div class="author-missing__content">
	{$i18nMessages.t(
		"desktop:AuthorMissingModalContent.yourCommitsNeedAuthorInformationToIdentifyWho",
	)}

	<Textbox
		disabled={settingInfo.current.isLoading}
		placeholder={$i18nMessages.t("desktop:AuthorMissingModalContent.yourFullName")}
		label={$i18nMessages.t("desktop:AuthorMissingModalContent.name")}
		testId={TestId.GlobalModal_AuthorMissing_NameInput}
		bind:value={name}
		autofocus
	/>

	<EmailTextbox
		disabled={settingInfo.current.isLoading}
		placeholder={$i18nMessages.t("desktop:AuthorMissingModalContent.yourEmailExampleCom")}
		label={$i18nMessages.t("desktop:AuthorMissingModalContent.emailAddress")}
		testId={TestId.GlobalModal_AuthorMissing_EmailInput}
		bind:value={email}
		bind:this={emailTextbox}
	/>
</div>
<ModalFooter>
	<Button kind="outline" onclick={close} disabled={settingInfo.current.isLoading}
		>{$i18nMessages.t("desktop:AuthorMissingModalContent.cancel")}</Button
	>
	<Button
		testId={TestId.GlobalModal_AuthorMissing_ActionButton}
		style="pop"
		onclick={handleSubmit}
		loading={settingInfo.current.isLoading}
		disabled={!name || !email}
	>
		{settingInfo.current.isLoading
			? $i18nMessages.t("desktop:AuthorMissingModalContent.saving")
			: $i18nMessages.t("desktop:AuthorMissingModalContent.saveContinue")}
	</Button>
</ModalFooter>

<style lang="postcss">
	.author-missing__content {
		display: flex;
		flex-direction: column;
		padding: 0 16px 16px 16px;
		gap: 16px;
	}
</style>
