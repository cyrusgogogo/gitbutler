<script lang="ts">
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import { getStackName } from "$lib/stacks/stack";
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { TestId } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import type { DependencyLock } from "@gitbutler/ui/utils/diffParsing";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		locks: DependencyLock[];
	};

	const { projectId, locks }: Props = $props();

	const stackService = inject(STACK_SERVICE);

	const lockedToStackIds = $derived(
		locks
			.filter((lock) => lock.target.type === "stack")
			.map((lock) => (lock.target as { type: "stack"; subject: string }).subject),
	);
	const stacksQuery = $derived(stackService.stacks(projectId));
</script>

<ReduxResult result={stacksQuery.result} {projectId}>
	{#snippet children(stacks)}
		{@const lockedToStacks = stacks.filter(
			(stack) => stack.id && lockedToStackIds.includes(stack.id),
		)}
		{@const stackNames = lockedToStacks.map((stack) =>
			getStackName(stack, $i18nMessages.t("desktop:stack.unnamed")),
		)}
		<div data-testid={TestId.UnifiedDiffViewLockWarning}>
			{#if stackNames.length > 1}
				<p>
					{$i18nMessages.t("desktop:LineLocksWarning.thisLineDependsOnChangesInsideTheFollowing")}
				</p>
				<br />
				<p>{stackNames.join(", ")}</p>
			{:else if stackNames.length === 1}
				<p>
					{#snippet i18nSlot1(content: import("svelte").Snippet)}<b>{@render content()}</b
						>{/snippet}
					<I18nRichMessage
						value={{
							key: "desktop:LineLocksWarning.thisLineDependsOnChangesInsideValue",
							values: { value: String(stackNames[0]) },
						}}
						components={{ slot1: i18nSlot1 }}
					/>
				</p>
			{:else}
				<p>
					{$i18nMessages.t(
						"desktop:LineLocksWarning.thisLineDependsOnChangesInsideAnUnidentifiable",
					)}
				</p>
			{/if}
		</div>
	{/snippet}
</ReduxResult>
