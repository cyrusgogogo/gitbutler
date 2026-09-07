<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, TestId } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		showFrame?: boolean;
		handleShow: () => void;
	}

	const { handleShow, showFrame = false }: Props = $props();

	function show() {
		handleShow();
	}
</script>

<div data-testid={TestId.LargeDiffMessage} class="large-diff-message" class:frame-box={showFrame}>
	<p class="text-13">
		{$i18nMessages.t("desktop:HiddenDiffNotice.changeHiddenAsLargeDiffsMaySlowDown")}
	</p>
	<Button testId={TestId.LargeDiffMessageButton} kind="outline" onclick={show}
		>{$i18nMessages.t("desktop:HiddenDiffNotice.showAnyways")}</Button
	>
</div>

<style>
	.large-diff-message {
		display: flex;
		flex-direction: column;
		padding: 12px;
		gap: 12px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
	}

	.frame-box {
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
	}
</style>
