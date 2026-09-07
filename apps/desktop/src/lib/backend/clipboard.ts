import { InjectionToken } from "@gitbutler/core/context";
import { message as i18nMessage, type LocalizedText } from "@gitbutler/i18n";
import { chipToasts } from "@gitbutler/ui";
import type { IBackend } from "$lib/backend/backend";

export const CLIPBOARD_SERVICE = new InjectionToken<ClipboardService>("ClipboardService");
export default class ClipboardService {
	constructor(private backend: IBackend) {}

	/**
	 * Copy the provided text into the the system clipboard. Upon completion, a toast will be displayed which contains
	 * information about the success of this operation.
	 *
	 * @param text text to be copied into the system clipboard.
	 * @param errorMessage optional custom error message which will be displayed if the operation fails. If this is
	 *                     not provided, a default generic message will be used.
	 */
	async write(
		text: string,
		opt: {
			errorMessage?: LocalizedText;
			message?: LocalizedText;
		} = {},
	) {
		const { errorMessage, message } = opt;
		await this.backend
			.writeTextToClipboard(text)
			.then(() => {
				chipToasts.success(message || i18nMessage("desktop:clipboard.copiedToClipboard"));
			})
			.catch((err) => {
				chipToasts.error(errorMessage || i18nMessage("desktop:clipboard.failedToCopy"));
				console.error(errorMessage, err);
			});
	}

	async read() {
		return await this.backend.readTextFromClipboard();
	}
}
