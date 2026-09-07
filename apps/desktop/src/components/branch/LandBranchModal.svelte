<script lang="ts">
	import { showError } from "$lib/error/showError";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { AsyncButton, Button, Modal, chipToasts } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		/** Remote-qualified name of the target branch (e.g. origin/master), shown for context. */
		targetBranchName: string | undefined;
	};

	const { projectId, targetBranchName }: Props = $props();
	const stackService = inject(STACK_SERVICE);

	let modalEl = $state<ReturnType<typeof Modal>>();
	let branchName = $state<string>();
	let wholeStack = $state(false);
	let lowerBranches = $state<string[]>([]);

	const targetLabel = $derived(
		targetBranchName ?? $i18nMessages.t("desktop:LandBranchModal.detail96e6d6c96"),
	);
	const landedLabel = $derived(
		wholeStack
			? $i18nMessages.t("desktop:LandBranchModal.detailcf7101ef5", { value1: String(branchName) })
			: `"${branchName}"`,
	);
	const lowerListLabel = $derived(lowerBranches.length > 0 ? ` (${lowerBranches.join(", ")})` : "");

	/**
	 * Passing `stack` lands the whole stack. The intent is carried by the argument itself, not by
	 * `lowerBranches` being non-empty — segments below can be unnamed (deleted branch refs) and
	 * still land.
	 */
	export function show(branch: string, stack?: { lowerBranches: string[] }) {
		branchName = branch;
		wholeStack = stack !== undefined;
		lowerBranches = stack?.lowerBranches ?? [];
		modalEl?.show();
	}

	async function land(): Promise<boolean> {
		if (!branchName) return false;
		try {
			const result = await stackService.landBranch({
				projectId,
				branch: branchName,
				noFf: false,
				wholeStack,
			});
			if (result.landed.type === "alreadyIntegrated") {
				chipToasts.success(
					i18nMessage("desktop:LandBranchModal.valueIsAlreadyIntegratedIntoValue", {
						landedLabel: String(landedLabel),
						targetLabel: String(targetLabel),
					}),
				);
			} else {
				chipToasts.success(
					i18nMessage("desktop:LandBranchModal.landedValueIntoValue", {
						landedLabel: String(landedLabel),
						targetLabel: String(targetLabel),
					}),
				);
			}
			if (result.reconcileSkipped) {
				chipToasts.warning(
					i18nMessage("desktop:LandBranchModal.otherBranchesWereLeftUnReconciledRunBut"),
				);
			}
			return true;
		} catch (error) {
			showError(i18nMessage("desktop:LandBranchModal.failedToLandBranch"), error);
			return false;
		}
	}
</script>

<Modal
	bind:this={modalEl}
	width="small"
	title={wholeStack
		? $i18nMessages.t("desktop:LandBranchModal.inlined105e59c6")
		: $i18nMessages.t("desktop:LandBranchModal.inlineadaf37272")}
>
	<p>
		{#if wholeStack}
			{#snippet i18nSlot1(content: import("svelte").Snippet)}<strong>{@render content()}</strong
				>{/snippet}
			<I18nRichMessage
				value={{
					key: "desktop:LandBranchModal.thisLandsValueAndEverythingBelowItIn",
					values: {
						branchName: String(branchName),
						lowerListLabel: String(lowerListLabel),
						targetLabel: String(targetLabel),
					},
				}}
				components={{ slot1: i18nSlot1 }}
			/>
		{:else}
			{#snippet i18nSlot2(content: import("svelte").Snippet)}<strong>{@render content()}</strong
				>{/snippet}
			<I18nRichMessage
				value={{
					key: "desktop:LandBranchModal.thisLandsValueDirectlyOntoValueItCannot",
					values: { branchName: String(branchName), targetLabel: String(targetLabel) },
				}}
				components={{ slot2: i18nSlot2 }}
			/>
		{/if}
	</p>
	{#snippet controls(close)}
		<Button kind="outline" type="reset" onclick={close}
			>{$i18nMessages.t("desktop:LandBranchModal.cancel")}</Button
		>
		<AsyncButton
			style="pop"
			action={async () => {
				if (await land()) close();
			}}>{$i18nMessages.t("desktop:LandBranchModal.land")}</AsyncButton
		>
	{/snippet}
</Modal>
