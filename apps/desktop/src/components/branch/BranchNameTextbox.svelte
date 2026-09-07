<script lang="ts">
	import { STACK_SERVICE } from "$lib/stacks/stackService.svelte";
	import { debounce } from "$lib/utils/debounce";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Icon, Textbox } from "@gitbutler/ui";
	import { onDestroy } from "svelte";
	import type { LocalizedText } from "@gitbutler/i18n";
	const i18nMessages = useTranslations();

	type Props = {
		value?: string;
		helperText?: string;
		onnormalizedvalue?: (normalized: string | undefined) => void;
		onvalidationchange?: (isValid: boolean) => void;
		[key: string]: any;
	};

	let {
		value = $bindable(),
		helperText,
		onnormalizedvalue,
		onvalidationchange,
		...restProps
	}: Props = $props();

	const stackService = inject(STACK_SERVICE);

	let textbox = $state<ReturnType<typeof Textbox>>();
	let isValidating = $state(false);
	let validationError = $state<LocalizedText | undefined>();
	let validationCounter = $state(0);
	let isDestroyed = false;

	let normalizedResult = $state<{ fromValue: string; normalized: string } | undefined>();

	const isValidState = $derived(
		!isValidating &&
			!validationError &&
			!!value &&
			!!normalizedResult?.normalized &&
			normalizedResult.fromValue === value,
	);
	$effect(() => {
		onvalidationchange?.(isValidState);
	});

	const namesDiverge = $derived(
		!!normalizedResult && normalizedResult.normalized !== normalizedResult.fromValue,
	);
	const computedHelperText = $derived(
		namesDiverge && normalizedResult
			? $i18nMessages.t("desktop:BranchNameTextbox.detail5608a26a9", {
					value1: String(normalizedResult.normalized),
				})
			: helperText,
	);

	const debouncedNormalize = debounce(async (inputValue: string) => {
		if (isDestroyed) return;

		if (!inputValue) {
			isValidating = false;
			validationError = undefined;
			normalizedResult = undefined;
			onnormalizedvalue?.(undefined);
			return;
		}

		const currentValidation = ++validationCounter;
		isValidating = true;
		validationError = undefined;

		try {
			const result = await stackService.normalizeBranchName(inputValue);
			// Only update if the value hasn't changed during the async call
			// and no newer validation has started
			if (!isDestroyed && value === inputValue && currentValidation === validationCounter) {
				normalizedResult = { fromValue: inputValue, normalized: result };
				onnormalizedvalue?.(result);
				validationError = undefined;
			}
		} catch {
			if (!isDestroyed && value === inputValue && currentValidation === validationCounter) {
				normalizedResult = undefined;
				onnormalizedvalue?.(undefined);
				validationError = i18nMessage("desktop:detail.d12fcb87c3");
			}
		} finally {
			if (!isDestroyed && currentValidation === validationCounter) {
				isValidating = false;
			}
		}
	}, 100);

	$effect(() => {
		debouncedNormalize(value || "");
	});

	export async function selectAll() {
		await textbox?.selectAll();
	}

	onDestroy(() => {
		isDestroyed = true;
		validationCounter++;
	});
</script>

<Textbox
	bind:this={textbox}
	bind:value
	helperText={computedHelperText}
	error={$i18nMessages.text(validationError ?? "")}
	{...restProps}
>
	{#snippet customIconRight()}
		{#if isValidating}
			<Icon name="spinner" />
		{/if}
	{/snippet}
</Textbox>
