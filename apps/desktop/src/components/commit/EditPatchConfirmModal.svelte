<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Modal, Button } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		fileName: string;
		onConfirm: () => void;
		onCancel: () => void;
	};

	const { fileName, onConfirm, onCancel }: Props = $props();

	let modal: Modal | undefined = $state();

	export function show() {
		modal?.show();
	}

	export function hide() {
		modal?.close();
	}
</script>

<Modal
	bind:this={modal}
	width="small"
	type="warning"
	title={$i18nMessages.t("desktop:EditPatchConfirmModal.resolveConflictsToPreview")}
>
	<p class="text-base-body-13 text-light">
		{#snippet i18nSlot1(content: import("svelte").Snippet)}<span class="text-bold"
				>{@render content()}</span
			>{/snippet}
		<I18nRichMessage
			value={{
				key: "desktop:EditPatchConfirmModal.theFileValueHasUnresolvedMergeConflictsThat",
				values: { fileName: String(fileName) },
			}}
			components={{ slot1: i18nSlot1 }}
		/>
	</p>

	{#snippet controls()}
		<Button kind="outline" onclick={onCancel}
			>{$i18nMessages.t("desktop:EditPatchConfirmModal.cancel")}</Button
		>
		<Button style="pop" onclick={onConfirm}
			>{$i18nMessages.t("desktop:EditPatchConfirmModal.resolveConflicts")}</Button
		>
	{/snippet}
</Modal>
