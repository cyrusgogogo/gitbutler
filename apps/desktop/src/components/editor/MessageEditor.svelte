<script lang="ts" module>
	export type AiButtonClickParams = {
		useHaiku?: boolean;
		useEmojiStyle?: boolean;
		useExtraConciseStyle?: boolean;
	};
</script>

<script lang="ts">
	import MessageEditorRuler from "$components/editor/MessageEditorRuler.svelte";
	import CommitSuggestions from "$components/editor/commitSuggestions.svelte";
	import {
		projectCommitGenerationExtraConcise,
		projectCommitGenerationHaiku,
		projectCommitGenerationUseEmojis,
	} from "$lib/config/config";

	import { UI_STATE } from "$lib/state/uiState.svelte";
	import { inject } from "@gitbutler/core/context";

	import { useTranslations } from "@gitbutler/i18n/svelte";

	import {
		Button,
		Checkbox,
		ContextMenuItem,
		ContextMenuSection,
		DropdownButton,
		EmojiPickerButton,
		RichTextEditor,
		Formatter,
		GhostTextPlugin,
		HardWrapPlugin,
		FormattingButton,
	} from "@gitbutler/ui";

	import { tick, untrack } from "svelte";
	const i18nMessages = useTranslations();

	interface Props {
		projectId: string;
		disabled?: boolean;
		initialValue?: string;
		placeholder: string;
		onChange?: (text: string) => void;
		onKeyDown?: (e: KeyboardEvent) => boolean;
		enableSmiles?: boolean;
		enableRuler?: boolean;
		onAiButtonClick: (params: AiButtonClickParams) => void;
		canUseAI: boolean;
		aiIsLoading: boolean;
		suggestionsHandler?: CommitSuggestions;
		testId?: string;
		forceSansFont?: boolean;
		useRuler?: boolean;
		messageType: "commit" | "pr";
		reviewUnitAbbr?: string;
	}

	let {
		projectId,
		initialValue,
		placeholder,
		disabled,
		enableSmiles,
		onChange,
		onKeyDown,
		onAiButtonClick,
		enableRuler,
		canUseAI,
		aiIsLoading,
		suggestionsHandler,
		testId,
		forceSansFont,
		useRuler,
		messageType,
		reviewUnitAbbr,
	}: Props = $props();

	const MIN_RULER_VALUE = 30;
	const MAX_RULER_VALUE = 200;

	const uiState = inject(UI_STATE);

	const commitGenerationExtraConcise = projectCommitGenerationExtraConcise(
		untrack(() => projectId),
	);
	const commitGenerationUseEmojis = projectCommitGenerationUseEmojis(untrack(() => projectId));
	const commitGenerationHaiku = projectCommitGenerationHaiku(untrack(() => projectId));

	const useFloatingBox = uiState.global.useFloatingBox;
	const diffFont = uiState.global.diffFont;
	const tabSize = uiState.global.tabSize;
	const diffLigatures = uiState.global.diffLigatures;

	const rulerCountValue = uiState.global.rulerCountValue;

	const wrapCountValue = $derived(rulerCountValue.current);

	let composer = $state<ReturnType<typeof RichTextEditor>>();
	let formatter = $state<ReturnType<typeof Formatter>>();

	export async function getPlaintext(): Promise<string | undefined> {
		return composer?.getPlaintext();
	}

	async function handleChange(
		text: string,
		textUpToAnchor: string | undefined,
		textAfterAnchor: string | undefined,
	) {
		onChange?.(text);
		await suggestionsHandler?.onChange(textUpToAnchor, textAfterAnchor);
	}

	function handleKeyDown(event: KeyboardEvent | null) {
		if (event && !event.metaKey && !event.ctrlKey) {
			// Prevent regular keystrokes from propagating so that we don't
			// trigger keyboard shortcuts while the user is typing a message.
			event.stopPropagation();
		}
		if (event && onKeyDown?.(event)) {
			return true;
		}
		return suggestionsHandler?.onKeyDown(event) ?? false;
	}

	function onEmojiSelect(emoji: string) {
		composer?.insertText(emoji);
	}

	export function focus() {
		composer?.focus();
	}

	export function setText(text: string) {
		composer?.setText(text);
	}

	export function isRichTextMode(): boolean {
		return false;
	}

	// We want to avoid letting most mouse events bubble up to the parent.
	function stopPropagation(e: MouseEvent) {
		e.stopPropagation();
	}

	function handleGenerateMessage() {
		if (aiIsLoading) return;

		onAiButtonClick({
			useHaiku: $commitGenerationHaiku,
			useEmojiStyle: $commitGenerationUseEmojis,
			useExtraConciseStyle: $commitGenerationExtraConcise,
		});
	}

	const DROPDOWN_BTN_BREAKPOINTS = {
		short: 280,
		medium: 320,
	};

	const generateMessages = $derived.by(() => ({
		commit: $i18nMessages.t("desktop:MessageEditor.detail22c5ab343"),
		pr: $i18nMessages.t("desktop:MessageEditor.detail47b4ced89", {
			value1: String(reviewUnitAbbr ?? "PR"),
		}),
	}));

	function getTooltipText(): string | undefined {
		if (!canUseAI) {
			return $i18nMessages.t("desktop:MessageEditor.detail2b09ec886");
		}
		if (currentEditorWidth <= DROPDOWN_BTN_BREAKPOINTS.medium) {
			return generateMessages[messageType];
		}
		return undefined;
	}

	let currentEditorWidth = $state<number>(0);
</script>

{#snippet buttonText()}
	{currentEditorWidth > DROPDOWN_BTN_BREAKPOINTS.medium
		? $i18nMessages.t("desktop:MessageEditor.generateMessage")
		: $i18nMessages.t("desktop:MessageEditor.generate")}
{/snippet}

<div
	data-remove-from-panning
	role="presentation"
	class="editor-wrapper hide-native-scrollbar"
	onclick={stopPropagation}
	ondblclick={stopPropagation}
	onmousedown={stopPropagation}
	onmouseup={stopPropagation}
	ondrag={stopPropagation}
	ondragend={stopPropagation}
	ondragenter={stopPropagation}
	ondragexit={stopPropagation}
	ondragleave={stopPropagation}
	ondragover={stopPropagation}
	ondragstart={stopPropagation}
	ondrop={stopPropagation}
>
	<div role="presentation" class="message-textarea">
		<div
			bind:clientWidth={currentEditorWidth}
			data-testid={testId}
			role="presentation"
			class="message-textarea__inner"
			onclick={() => {
				composer?.focus();
			}}
		>
			{#if useRuler && enableRuler}
				<MessageEditorRuler monospaceFont={diffFont.current} />
			{/if}

			<div class="message-textarea__wrapper">
				<RichTextEditor
					minHeight="4rem"
					styleContext="client-editor"
					namespace="CommitMessageEditor"
					{placeholder}
					bind:this={composer}
					onError={(e) => console.warn("Editor error", e)}
					initialText={initialValue}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					{disabled}
					useMonospaceFont={useRuler && !forceSansFont}
					monospaceFont={diffFont.current}
					tabSize={tabSize.current}
					enableLigatures={diffLigatures.current}
					autoFocus={false}
				>
					{#snippet plugins()}
						<Formatter bind:this={formatter} />

						{#if suggestionsHandler}
							<GhostTextPlugin
								bind:this={suggestionsHandler.ghostTextComponent}
								onSelection={(text) => suggestionsHandler.onAcceptSuggestion(text)}
							/>
						{/if}
						<HardWrapPlugin enabled={useRuler} maxLength={wrapCountValue} />
					{/snippet}
				</RichTextEditor>
			</div>
		</div>

		<div class="message-textarea__toolbar">
			<div class="message-textarea__toolbar__left">
				<Button
					kind="ghost"
					icon={useFloatingBox.current ? "pop-out-top-left" : "pop-out-bottom-right"}
					tooltip={useFloatingBox.current
						? $i18nMessages.t("desktop:MessageEditor.inline7c17fcd6e")
						: $i18nMessages.t("desktop:MessageEditor.inline197c01505")}
					onclick={() => {
						useFloatingBox.set(!useFloatingBox.current);
					}}
				/>
				<div class="message-textarea__toolbar__divider"></div>
				{#if enableSmiles}
					<EmojiPickerButton onEmojiSelect={(emoji) => onEmojiSelect(emoji.unicode)} />
				{/if}

				{#if enableRuler}
					<FormattingButton
						icon="text-wrap"
						activated={useRuler}
						tooltip={$i18nMessages.t("desktop:MessageEditor.wrapTextAutomatically")}
						onclick={async () => {
							uiState.global.useRuler.set(!useRuler);
							await tick(); // Wait for reactive update.
							if (useRuler) {
								composer?.wrapAll();
							}
						}}
					/>
					{#if useRuler}
						<div class="message-textarea__ruler-input-wrapper">
							<input
								value={rulerCountValue.current}
								min={MIN_RULER_VALUE}
								max={MAX_RULER_VALUE}
								class="text-13 text-input message-textarea__ruler-input"
								type="number"
								onblur={() => {
									if (rulerCountValue.current < MIN_RULER_VALUE) {
										console.warn("Ruler value must be greater than 10");
										rulerCountValue.set(MIN_RULER_VALUE);
									} else if (rulerCountValue.current > MAX_RULER_VALUE) {
										rulerCountValue.set(MAX_RULER_VALUE);
									}
								}}
								oninput={(e) => {
									const input = e.currentTarget as HTMLInputElement;
									rulerCountValue.set(parseInt(input.value));
								}}
								onkeydown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										composer?.focus();
									}
								}}
							/>
						</div>
					{/if}
				{/if}
			</div>
			<DropdownButton
				kind="outline"
				icon="ai"
				shrinkable
				disabled={!canUseAI}
				loading={aiIsLoading}
				onclick={handleGenerateMessage}
				children={currentEditorWidth > DROPDOWN_BTN_BREAKPOINTS.short ? buttonText : undefined}
				tooltip={getTooltipText()}
			>
				{#snippet contextMenuSlot()}
					<ContextMenuSection>
						<ContextMenuItem
							label={$i18nMessages.t("desktop:MessageEditor.extraConcise")}
							onclick={() => ($commitGenerationExtraConcise = !$commitGenerationExtraConcise)}
						>
							{#snippet control()}
								<Checkbox small bind:checked={$commitGenerationExtraConcise} />
							{/snippet}
						</ContextMenuItem>

						<ContextMenuItem
							label={$i18nMessages.t("desktop:MessageEditor.haiku")}
							onclick={() => ($commitGenerationHaiku = !$commitGenerationHaiku)}
						>
							{#snippet control()}
								<Checkbox small bind:checked={$commitGenerationHaiku} />
							{/snippet}
						</ContextMenuItem>

						<ContextMenuItem
							label={$i18nMessages.t("desktop:MessageEditor.useEmojis")}
							onclick={() => ($commitGenerationUseEmojis = !$commitGenerationUseEmojis)}
						>
							{#snippet control()}
								<Checkbox small bind:checked={$commitGenerationUseEmojis} />
							{/snippet}
						</ContextMenuItem>
					</ContextMenuSection>
				{/snippet}
			</DropdownButton>
		</div>
	</div>
</div>

<style lang="postcss">
	.editor-wrapper {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
	}

	/* MESSAGE INPUT */
	.message-textarea {
		display: flex;
		position: relative;
		flex: 1;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--border-2);
		border-radius: 0 0 var(--radius-m) var(--radius-m);
		background-color: var(--bg-1);
		transition: border-color var(--transition-fast);

		&:hover,
		&:focus-within {
			border-color: var(--border-1);
		}
	}

	.message-textarea__toolbar {
		container-type: inline-size;
		display: flex;
		position: relative;
		flex: 0 0 auto;
		align-items: center;
		justify-content: flex-start;
		height: var(--lexical-input-client-toolbar-height);
		padding: 0 8px;
		gap: 6px;

		&:after {
			position: absolute;
			top: 0;
			left: 8px;
			width: calc(100% - 16px);
			height: 1px;
			background-color: var(--border-3);
			content: "";
		}
	}

	.message-textarea__toolbar__left {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 6px;
	}

	.message-textarea__toolbar__divider {
		width: 1px;
		height: 18px;
		background-color: var(--border-3);
	}

	/* RULER INPUT */
	.message-textarea__ruler-input-wrapper {
		display: flex;
		align-items: center;
		padding: 0 4px;
		gap: 5px;
	}

	.message-textarea__ruler-input {
		width: 30px;
		padding: 2px 0;
		text-align: center;

		/* remove number arrows */
		&::-webkit-inner-spin-button,
		&::-webkit-outer-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}

	/*  */
	.message-textarea__inner {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.message-textarea__wrapper {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
	}

	/* MODAL */
</style>
