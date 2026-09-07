<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { persisted } from "@gitbutler/shared/persisted";
	import {
		Button,
		ContextMenuItem,
		ContextMenuSection,
		DropdownButton,
		TestId,
	} from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		isCreatingPR: boolean;
		canPublishPR: boolean;
		submitDisabled?: boolean;
		isFormBusy?: boolean;
		reviewUnit: string | undefined;
		onCancel: () => void;
		onSubmit: () => void;
	}

	let {
		canPublishPR,
		submitDisabled,
		isCreatingPR,
		isFormBusy,
		onCancel,
		onSubmit,
		reviewUnit,
	}: Props = $props();

	const unit = $derived(reviewUnit ?? "PR");
	let commitButton = $state<DropdownButton>();

	const createDraft = persisted<boolean>(false, "createDraftPr");
</script>

<div class="submit-review-actions">
	<Button
		testId={TestId.ReviewCancelButton}
		kind="outline"
		disabled={isFormBusy || isCreatingPR}
		width={120}
		onclick={onCancel}>{$i18nMessages.t("desktop:ReviewCreationControls.cancel")}</Button
	>

	<DropdownButton
		testId={TestId.ReviewCreateButton}
		bind:this={commitButton}
		onclick={() => {
			if (isFormBusy || isCreatingPR) return;
			onSubmit();
		}}
		wide
		style="pop"
		loading={isCreatingPR}
		disabled={submitDisabled || isFormBusy}
		hotkey="⌘↵"
	>
		{$createDraft
			? $i18nMessages.t("desktop:ReviewCreationControls.inline387359290", { value1: String(unit) })
			: $i18nMessages.t("desktop:ReviewCreationControls.inlineb8f6b0e1e", { value1: String(unit) })}

		{#snippet contextMenuSlot()}
			<ContextMenuSection>
				<ContextMenuItem
					label={$i18nMessages.t("desktop:ReviewCreationControls.createValueDraft", {
						unit: String(unit),
					})}
					onclick={() => {
						$createDraft = true;
						commitButton?.close();
					}}
					disabled={!canPublishPR}
				/>

				<ContextMenuItem
					label={$i18nMessages.t("desktop:ReviewCreationControls.createValue", {
						unit: String(unit),
					})}
					onclick={() => {
						$createDraft = false;
						commitButton?.close();
					}}
				/>
			</ContextMenuSection>
		{/snippet}
	</DropdownButton>
</div>

<style lang="postcss">
	.submit-review-actions {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		gap: 6px;
	}
</style>
