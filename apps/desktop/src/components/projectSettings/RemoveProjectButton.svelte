<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal, TestId } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	interface Props {
		projectTitle?: string;
		isDeleting?: boolean;
		noModal?: boolean;
		outlineStyle?: boolean;
		onDeleteClicked: () => Promise<void>;
	}

	const {
		projectTitle = "#",
		isDeleting,
		noModal,
		outlineStyle,
		onDeleteClicked,
	}: Props = $props();

	export function show() {
		modal?.show();
	}
	export function close() {
		modal?.close();
	}

	function handleClick() {
		if (noModal) {
			onDeleteClicked();
		} else {
			modal?.show();
		}
	}

	let modal = $state<Modal>();
</script>

<Button
	testId={TestId.ProjectDeleteButton}
	style="danger"
	kind={outlineStyle ? "outline" : "solid"}
	icon="bin"
	reversedDirection
	onclick={handleClick}
>
	{$i18nMessages.t("desktop:RemoveProjectButton.removeProject")}
</Button>

<Modal
	bind:this={modal}
	width="small"
	onSubmit={(close) => {
		onDeleteClicked().then(close);
	}}
>
	<div class="remove-project-description">
		<p class="text-14 text-body">
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<span class="text-bold"
					>{@render content()}</span
				>{/snippet}
			<I18nRichMessage
				value={{
					key: "desktop:RemoveProjectButton.areYouSureYouWantToRemoveValue",
					values: { projectTitle: String(projectTitle) },
				}}
				components={{ slot1: i18nSlot1 }}
			/>
		</p>

		<p class="text-12 text-body details-text">
			{$i18nMessages.t("desktop:RemoveProjectButton.whenYouDeleteYourProjectFromGitButlerYour")}
		</p>
	</div>

	{#snippet controls()}
		<Button
			testId={TestId.ProjectDeleteModalConfirm}
			style="danger"
			kind="outline"
			reversedDirection
			loading={isDeleting}
			icon="bin"
			type="submit"
		>
			{$i18nMessages.t("desktop:RemoveProjectButton.remove")}
		</Button>
		<Button style="pop" onclick={close}
			>{$i18nMessages.t("desktop:RemoveProjectButton.cancel")}</Button
		>
	{/snippet}
</Modal>

<style lang="postcss">
	.remove-project-description {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.details-text {
		opacity: 0.5;
	}
</style>
