<script lang="ts">
	import { FORGE_INFO_SERVICE } from "$lib/forge/forgeInfo.svelte";
	import { MergeMethod } from "$lib/forge/interface/types";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { persisted, type Persisted } from "@gitbutler/shared/persisted";
	import { ContextMenuItem, ContextMenuSection, DropdownButton, TestId } from "@gitbutler/ui";
	import { untrack } from "svelte";
	import type { ButtonProps } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		projectId: string;
		onclick: (method: MergeMethod) => Promise<void>;
		disabled?: boolean;
		wide?: boolean;
		tooltip?: string;
		style?: ButtonProps["style"];
		kind?: ButtonProps["kind"];
		isDraft?: boolean;
		onSetDraft?: (draft: boolean) => Promise<void>;
	}

	const {
		projectId,
		onclick,
		disabled = false,
		wide = false,
		tooltip = "",
		style = "gray",
		kind = "outline",
		isDraft = false,
		onSetDraft,
	}: Props = $props();

	const forgeInfoService = inject(FORGE_INFO_SERVICE);
	const forgeInfoQuery = $derived(forgeInfoService.get(projectId));
	const forgeName = $derived(forgeInfoQuery.response?.name);
	// GitLab doesn't offer a "rebase and merge" strategy.
	const supportsRebase = $derived(forgeName !== "gitlab");

	function persistedAction(projectId: string): Persisted<MergeMethod> {
		const key = "projectMergeMethod";
		return persisted<MergeMethod>(MergeMethod.Merge, key + projectId);
	}

	const action = persistedAction(untrack(() => projectId));

	$effect(() => {
		if (!supportsRebase && $action === MergeMethod.Rebase) {
			$action = MergeMethod.Merge;
		}
	});

	let dropDown: ReturnType<typeof DropdownButton> | undefined;
	let loading = $state(false);

	// Available merge methods based on forge type
	const availableMethods = $derived(
		supportsRebase
			? [MergeMethod.Merge, MergeMethod.Rebase, MergeMethod.Squash]
			: [MergeMethod.Merge, MergeMethod.Squash],
	);

	const labels = $derived({
		[MergeMethod.Merge]: $i18nMessages.t("desktop:MergeButton.detailea8f0d023"),
		[MergeMethod.Rebase]: $i18nMessages.t("desktop:MergeButton.detail5693314a7"),
		[MergeMethod.Squash]: $i18nMessages.t("desktop:MergeButton.detailff2648147"),
	});
</script>

<DropdownButton
	bind:this={dropDown}
	testId={TestId.PRMergeButton}
	onclick={async () => {
		loading = true;
		try {
			await onclick?.($action);
		} finally {
			loading = false;
		}
	}}
	{style}
	{kind}
	{loading}
	{wide}
	{tooltip}
	{disabled}
>
	{labels[$action]}
	{#snippet contextMenuSlot()}
		<ContextMenuSection>
			{#each availableMethods as method}
				<ContextMenuItem
					label={labels[method]}
					onclick={() => {
						$action = method;
						dropDown?.close();
					}}
				/>
			{/each}
		</ContextMenuSection>
		{#if onSetDraft}
			<ContextMenuSection>
				<ContextMenuItem
					label={isDraft
						? $i18nMessages.t("desktop:MergeButton.inline8c2d9db10")
						: $i18nMessages.t("desktop:MergeButton.inlineab263713a")}
					onclick={async () => {
						dropDown?.close();
						loading = true;
						try {
							await onSetDraft(!isDraft);
						} finally {
							loading = false;
						}
					}}
				/>
			</ContextMenuSection>
		{/if}
	{/snippet}
</DropdownButton>
