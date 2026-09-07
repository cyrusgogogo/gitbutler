<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { AsyncButton, Button, Modal } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		onSubmit: () => void;
	}

	const { onSubmit }: Props = $props();

	let modalEl = $state<ReturnType<typeof Modal>>();

	export function show() {
		modalEl?.show();
	}
	export function close() {
		modalEl?.close();
	}
</script>

<Modal bind:this={modalEl} width="small">
	<div>
		<p>
			{$i18nMessages.t(
				"desktop:ConflictResolutionConfirmModal.itSGenerallyBetterToStartResolvingConflicts",
			)}
		</p>
		<br />
		<p>
			{$i18nMessages.t(
				"desktop:ConflictResolutionConfirmModal.areYouSureYouWantToResolveConflicts",
			)}
		</p>
	</div>
	{#snippet controls(close)}
		<Button kind="outline" type="reset" onclick={close}
			>{$i18nMessages.t("desktop:ConflictResolutionConfirmModal.cancel")}</Button
		>
		<AsyncButton
			style="pop"
			action={async () => {
				await onSubmit();
				close();
			}}>{$i18nMessages.t("desktop:ConflictResolutionConfirmModal.yes")}</AsyncButton
		>
	{/snippet}
</Modal>
