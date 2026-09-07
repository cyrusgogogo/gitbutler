<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Textbox } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		password?: string;
		passwordConfirmation?: string;
		showValidation?: boolean;
		autocomplete?: boolean;
	}

	let {
		password = $bindable(),
		passwordConfirmation = $bindable(),
		showValidation = true,
		autocomplete = true,
	}: Props = $props();

	let passwordTouched = $state(false);
	let passwordConfirmationTouched = $state(false);

	const passwordsMatch = $derived(password === passwordConfirmation);

	function validatePassword(pwd: string) {
		if (!pwd) return { isValid: false, errors: [] };

		const errors = [];

		// Length check (minimum 8 characters)
		if (pwd.length < 8) {
			errors.push($i18nMessages.t("web:detail.84b24d5c33"));
		}

		// Must contain at least one lowercase letter
		if (!/[a-z]/.test(pwd)) {
			errors.push($i18nMessages.t("web:detail.083c7cab82"));
		}

		// Must contain at least one uppercase letter
		if (!/[A-Z]/.test(pwd)) {
			errors.push($i18nMessages.t("web:detail.87f6093c41"));
		}

		// Must contain at least one number
		if (!/\d/.test(pwd)) {
			errors.push($i18nMessages.t("web:detail.1d89b5377c"));
		}

		return { isValid: errors.length === 0, errors };
	}

	const passwordValidation = $derived(validatePassword(password || ""));
	const isPasswordValid = $derived(passwordValidation.isValid);

	const passwordError = $derived(
		showValidation && passwordTouched && password && !isPasswordValid
			? $i18nMessages.t("web:detail.ac1a46e9d3", {
					value1: String(passwordValidation.errors.join(", ")),
				})
			: undefined,
	);

	const passwordHelperText = $derived(
		showValidation && password && isPasswordValid
			? $i18nMessages.t("web:detail.b54e9f2d66")
			: showValidation
				? $i18nMessages.t("web:detail.0a8dd285c1")
				: undefined,
	);

	const passwordConfirmationError = $derived(
		passwordConfirmationTouched && passwordConfirmation && !passwordsMatch
			? $i18nMessages.t("web:detail.d69c3b1ac5")
			: undefined,
	);

	// Export validation state for parent components
	const _isValid = $derived(isPasswordValid && passwordConfirmation?.trim() && passwordsMatch);

	export function isValid() {
		return _isValid;
	}
</script>

<div class="password-confirmation">
	<Textbox
		bind:value={password}
		label={$i18nMessages.t("web:PasswordConfirmation.password")}
		type="password"
		{autocomplete}
		error={passwordError}
		helperText={passwordHelperText}
		onblur={() => {
			passwordTouched = true;
		}}
	/>
	<Textbox
		bind:value={passwordConfirmation}
		label={$i18nMessages.t("web:PasswordConfirmation.confirmPassword")}
		type="password-non-visible"
		{autocomplete}
		error={passwordConfirmationError}
		oninput={() => {
			passwordConfirmationTouched = true;
		}}
		onblur={() => {
			passwordConfirmationTouched = true;
		}}
	/>
</div>

<style lang="postcss">
	.password-confirmation {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
</style>
