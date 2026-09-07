<script lang="ts">
	import Textbox from "$components/Textbox.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const i18nMessages = useTranslations();

	interface Props {
		// Email-specific props
		customValidationMessage?: string;
		// All other props are forwarded to Textbox
		[key: string]: any;
	}

	let {
		customValidationMessage: providedCustomValidationMessage,
		value = $bindable(),
		oninput,
		onchange,
		...restProps
	}: Props = $props();
	const customValidationMessage = $derived(
		providedCustomValidationMessage ?? $i18nMessages.t("ui:EmailTextbox.defaultd2306dd89"),
	);

	let emailTouched = $state(false);
	const emailError = $derived(
		emailTouched && value && !validateEmail(value) ? customValidationMessage : undefined,
	);

	function validateEmail(val: string): boolean {
		if (!val) return true; // Empty is valid (unless required)
		// Simple email regex
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
	}

	function handleInput(val: string) {
		value = val;
		oninput?.(val);
	}
	function handleChange() {
		emailTouched = true;
		onchange?.(value || "");
	}
	export function isValid(): boolean {
		return !value || validateEmail(value);
	}
	export function validate(): boolean {
		emailTouched = true;
		return isValid();
	}
</script>

<Textbox
	{...restProps}
	type="text"
	bind:value
	error={emailError}
	oninput={handleInput}
	onchange={handleChange}
/>
