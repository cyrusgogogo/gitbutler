<script lang="ts">
	import { dismissToast, toastStore } from "$lib/notifications/toasts";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { InfoMessage, Markdown, TestId } from "@gitbutler/ui";
	import { slide } from "svelte/transition";
	import type { LocalizedText, MessageValues } from "@gitbutler/i18n";
	const translations = useTranslations();
	function escapeValues(values?: MessageValues): MessageValues {
		return Object.fromEntries(
			Object.entries(values ?? {}).map(([key, value]) => [
				key,
				typeof value === "string"
					? value.replace(/([\\`*_{}[\]<>()#!|])/g, "\\$1")
					: typeof value === "object"
						? { key: value.key, values: escapeValues(value.values) }
						: value,
			]),
		);
	}
	function markdown(value: LocalizedText, text: typeof $translations.text) {
		return typeof value === "string"
			? value
			: text({ key: value.key, values: escapeValues(value.values) });
	}
</script>

<div class="toast-controller hide-native-scrollbar">
	{#each $toastStore as toast (toast.id)}
		<!-- eslint-disable-next-line func-style -->
		{@const dismiss = () => dismissToast(toast.id)}
		<div transition:slide={{ duration: 170 }}>
			<InfoMessage
				testId={toast.testId ?? TestId.ToastInfoMessage}
				style={toast.style ?? "info"}
				error={toast.error}
				secondaryLabel={toast.extraAction
					? $translations.text(toast.extraAction.label)
					: $translations.t("common:dismiss")}
				secondaryTestId={toast.extraAction ? toast.extraAction.testId : undefined}
				secondaryAction={toast.extraAction ? () => toast.extraAction?.onClick(dismiss) : dismiss}
				tertiaryLabel={toast.extraAction ? $translations.t("common:dismiss") : undefined}
				tertiaryAction={toast.extraAction ? dismiss : undefined}
				shadow
			>
				{#snippet title()}
					{toast.title ? $translations.text(toast.title) : ""}
				{/snippet}

				{#snippet content()}
					{#if toast.message}
						<Markdown content={markdown(toast.message, $translations.text)} />
					{/if}
				{/snippet}
			</InfoMessage>
		</div>
	{/each}
</div>

<style>
	.toast-controller {
		display: flex;
		z-index: var(--z-blocker);
		position: absolute;
		right: 0;
		bottom: 0;
		flex-direction: column;
		max-width: 480px;
		max-height: 100%;
		padding: 12px 12px 12px 0;
		overflow-y: auto;
		gap: 8px;
		user-select: none;
	}
</style>
