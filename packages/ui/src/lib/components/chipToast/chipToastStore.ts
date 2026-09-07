import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
import { writable } from "svelte/store";
import type { ChipToastData, ChipToastOptions } from "$components/chipToast/chipToastTypes";

let toastId = 0;

function generateId(): string {
	return `toast-${++toastId}`;
}

function createChipToastStore() {
	const { subscribe, update } = writable<ChipToastData[]>([]);

	function addChipToast(message: LocalizedText, options: ChipToastOptions = {}): string {
		const id = generateId();
		const chipToast: ChipToastData = {
			id,
			message,
			type: options.type || "info",
			customButton: options.customButton,
			showDismiss: options.showDismiss,
		};

		update((chipToasts) => [...chipToasts, chipToast]);

		// Auto-remove after 4 seconds, but only if dismiss button is not shown
		if (!options.showDismiss) {
			setTimeout(() => {
				removeChipToast(id);
			}, 4000);
		}

		return id;
	}

	function removeChipToast(id: string) {
		update((chipToasts) => chipToasts.filter((chipToast) => chipToast.id !== id));
	}

	function clearAll() {
		update(() => []);
	}

	// Convenience methods for different chipToast types
	function info(message: LocalizedText, options: Omit<ChipToastOptions, "type"> = {}) {
		return addChipToast(message, { type: "info", ...options });
	}

	function success(message: LocalizedText, options: Omit<ChipToastOptions, "type"> = {}) {
		return addChipToast(message, { type: "success", ...options });
	}

	function warning(message: LocalizedText, options: Omit<ChipToastOptions, "type"> = {}) {
		return addChipToast(message, { type: "warning", ...options });
	}

	function error(message: LocalizedText, options: Omit<ChipToastOptions, "type"> = {}) {
		return addChipToast(message, { type: "danger", ...options });
	}

	// Keep loading function for compatibility - just an alias for info
	function loading(message: LocalizedText, options: Omit<ChipToastOptions, "type"> = {}) {
		return info(message, options);
	}

	// Simple promise function that handles loading/success/error states
	async function promise<T>(
		promiseToHandle: Promise<T>,
		opts: {
			loading: LocalizedText;
			success: LocalizedText;
			error: LocalizedText;
		} = {
			loading: i18nMessage("ui:chipToast.loading"),
			success: i18nMessage("ui:chipToast.success"),
			error: i18nMessage("ui:chipToast.error"),
		},
	): Promise<T> {
		const loadingToastId = loading(opts.loading);

		try {
			const result = await promiseToHandle;
			removeChipToast(loadingToastId);
			success(opts.success);
			return result;
		} catch (err) {
			removeChipToast(loadingToastId);
			error(opts.error);
			throw err;
		}
	}

	return {
		subscribe,
		addChipToast,
		removeChipToast,
		clearAll,
		info,
		success,
		warning,
		error,
		loading,
		promise,
	};
}

export const chipToasts = createChipToastStore();
