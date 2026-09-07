import { chipToasts } from "$components/chipToast/chipToastStore";
import { message as i18nMessage } from "@gitbutler/i18n";

export function copyToClipboard(text: string) {
	if (!navigator.clipboard) {
		chipToasts.error(i18nMessage("ui:clipboard.clipboardAPINotAvailable"));
	} else {
		navigator.clipboard
			.writeText(text)
			.then(function () {
				chipToasts.success(i18nMessage("ui:clipboard.copiedToClipboard"));
			})
			.catch(function (err) {
				chipToasts.error(i18nMessage("ui:clipboard.failedToCopy"));
				console.error("Failed to copy:", err);
			});
	}
}
