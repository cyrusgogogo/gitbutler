import { classify } from "$lib/error/errorClassification";
import { showToast, type Toast } from "$lib/notifications/toasts";
import type { LocalizedText } from "@gitbutler/i18n";

type ExtraAction = NonNullable<Toast["extraAction"]>;

export function showError(
	title: LocalizedText,
	error: unknown,
	extraAction?: ExtraAction,
	id?: string,
) {
	const classified = classify(error, title);
	if (classified.severity === "silent") {
		return;
	}

	showToast({
		id,
		title: classified.title,
		message: classified.userMessage,
		error: classified.message,
		style: classified.severity === "warning" ? "warning" : "danger",
		extraAction: extraAction ?? classified.actionHint,
	});
}
