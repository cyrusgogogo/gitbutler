<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, TestId } from "@gitbutler/ui";
	import { type Snippet } from "svelte";
	const i18nMessages = useTranslations();

	interface Props {
		CancelButtonLabel?: string;
		onCancel: () => void;
		children: Snippet;
	}

	const { children, CancelButtonLabel: providedCancelButtonLabel, onCancel }: Props = $props();
	const CancelButtonLabel = $derived(
		providedCancelButtonLabel ?? $i18nMessages.t("desktop:EditorFooter.default77dfd2135"),
	);
</script>

<div class="editor-footer">
	<Button
		testId={TestId.CommitDrawerCancelButton}
		kind="outline"
		width={120}
		style="gray"
		onclick={onCancel}>{CancelButtonLabel}</Button
	>
	{@render children()}
</div>

<style lang="postcss">
	.editor-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		margin-top: 14px;
		gap: 6px;
	}
</style>
