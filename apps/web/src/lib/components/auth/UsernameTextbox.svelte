<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Textbox } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		// Username-specific props
		customValidationMessage?: string;
		minLength?: number;
		maxLength?: number;
		value?: string;
		label?: string;
		placeholder?: string;
		// All other props are forwarded to Textbox
		[key: string]: any;
	}

	let {
		customValidationMessage,
		minLength = 3,
		maxLength = 30,
		value = $bindable(),
		label,
		...restProps
	}: Props = $props();

	let usernameTouched = $state(false);
	const validation = $derived(validateUsername(value ?? ""));
	const usernameError = $derived(
		usernameTouched && value && !validation.isValid
			? validation.message || customValidationMessage || $i18nMessages.t("web:detail.8fbe8abaaf")
			: undefined,
	);

	function validateUsername(val: string): { isValid: boolean; message?: string } {
		if (!val) return { isValid: true }; // Empty is valid (unless required)

		// Check length
		if (val.length < minLength) {
			return {
				isValid: false,
				message: $i18nMessages.t("web:detail.23c184531d", { value1: String(minLength) }),
			};
		}

		if (val.length > maxLength) {
			return {
				isValid: false,
				message: $i18nMessages.t("web:detail.345fd74b36", { value1: String(maxLength) }),
			};
		}

		// Check for valid characters: alphanumeric, underscores, hyphens
		// Must start with alphanumeric character
		if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(val)) {
			return {
				isValid: false,
				message: $i18nMessages.t("web:detail.2a8b6602a0"),
			};
		}

		// Cannot end with hyphen or underscore
		if (/[-_]$/.test(val)) {
			return {
				isValid: false,
				message: $i18nMessages.t("web:detail.c0f3de7299"),
			};
		}

		// Cannot have consecutive special characters
		if (/[-_]{2,}/.test(val)) {
			return {
				isValid: false,
				message: $i18nMessages.t("web:detail.c2cd0f4b8b"),
			};
		}

		return { isValid: true };
	}

	function handleInput(val: string) {
		value = val;
	}
	function handleChange() {
		usernameTouched = true;
	}
	export function isValid(): boolean {
		return validation.isValid;
	}
	export function validate(): boolean {
		usernameTouched = true;
		return validation.isValid;
	}
</script>

<Textbox
	{...restProps}
	label={label ?? $i18nMessages.t("web:detail.84c29015de")}
	type="text"
	bind:value
	error={usernameError}
	oninput={handleInput}
	onchange={handleChange}
/>
