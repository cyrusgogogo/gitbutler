<script lang="ts">
	import AIPromptEntry from "$components/settings/AIPromptEntry.svelte";
	import { PROMPT_SERVICE } from "$lib/ai/aiPromptService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button } from "@gitbutler/ui";
	import { untrack } from "svelte";
	import { get } from "svelte/store";
	import type { Prompts, UserPrompt } from "$lib/ai/types";
	const i18nMessages = useTranslations();

	interface Props {
		promptUse: "commits" | "branches";
	}

	const { promptUse }: Props = $props();

	const promptService = inject(PROMPT_SERVICE);

	let prompts = $state<Prompts>();

	if (untrack(() => promptUse) === "commits") {
		prompts = promptService.commitPrompts;
	} else {
		prompts = promptService.branchPrompts;
	}

	const userPrompts = $derived(prompts.userPrompts);

	function createNewPrompt() {
		prompts?.userPrompts.set([
			...get(prompts.userPrompts),
			promptService.createDefaultUserPrompt(promptUse),
		]);
	}

	function deletePrompt(targetPrompt: UserPrompt) {
		if (prompts) {
			const filteredPrompts = get(prompts.userPrompts).filter((prompt) => prompt !== targetPrompt);
			prompts.userPrompts.set(filteredPrompts);
		}
	}
</script>

{#if prompts && $userPrompts}
	<div class="prompt-item__title">
		<h3 class="text-15 text-bold">
			{promptUse === "commits"
				? $i18nMessages.t("desktop:AIPromptEdit.commitMessage")
				: $i18nMessages.t("desktop:AIPromptEdit.branchName")}
		</h3>
		<Button kind="outline" icon="plus" onclick={createNewPrompt}
			>{$i18nMessages.t("desktop:AIPromptEdit.newPrompt")}</Button
		>
	</div>
	<div class="content">
		<AIPromptEntry
			displayMode="readOnly"
			prompt={{
				prompt: prompts.defaultPrompt,
				name: $i18nMessages.t("desktop:AIPromptEdit.inline8697207a6"),
				id: "default",
			}}
		/>

		{#each $userPrompts as _prompt, idx}
			<AIPromptEntry
				bind:prompt={$userPrompts[idx] as UserPrompt}
				displayMode="writable"
				deletePrompt={(prompt) => deletePrompt(prompt)}
			/>
		{/each}
	</div>
{/if}

<style lang="postcss">
	.prompt-item__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
</style>
