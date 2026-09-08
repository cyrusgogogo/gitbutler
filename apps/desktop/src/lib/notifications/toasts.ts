import { createI18n, type LocalizedText } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/desktop";
import { writable, type Writable } from "svelte/store";
import type { MessageStyle } from "@gitbutler/ui";

// Local logs keep stable English messages, regardless of the display language.
export const canonicalMessages = createI18n(resources, "en");

type ExtraAction = {
	label: LocalizedText;
	testId?: string;
	onClick: (dismiss: () => void) => void;
};

export interface Toast {
	id?: string;
	testId?: string;
	message?: LocalizedText;
	error?: any;
	title?: LocalizedText;
	style?: MessageStyle;
	extraAction?: ExtraAction;
}

export const toastStore: Writable<Toast[]> = writable([]);

let idCounter = 0;

export function showToast(toast: Toast) {
	if (typeof toast.message === "string") toast.message = toast.message.replace(/^ */gm, "");
	if (!toast.id) {
		toast = { ...toast, id: `${idCounter++}` };
	}
	toastStore.update((items) => [
		...items.filter((t) => toast.id === undefined || t.id !== toast.id),
		toast,
	]);
}

export function showInfo(title: LocalizedText, message: LocalizedText, extraAction?: ExtraAction) {
	showToast({ title, message, style: "info", extraAction });
}

export function showWarning(
	title: LocalizedText,
	message: LocalizedText,
	extraAction?: ExtraAction,
	testId?: string,
) {
	showToast({ title, message, style: "warning", extraAction, testId });
}

export function dismissToast(messageId: string | undefined) {
	if (!messageId) return;
	toastStore.update((items) => items.filter((m) => m.id !== messageId));
}
