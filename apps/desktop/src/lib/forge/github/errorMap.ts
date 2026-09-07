import { message as i18nMessage } from "@gitbutler/i18n";
import type { Toast } from "$lib/notifications/toasts";

export function mapErrorToToast(err: any): Toast | undefined {
	// We expect an object to be thrown by octokit.
	if (typeof err !== "object") return;

	const status = err?.status;
	const response = err?.response;
	const data = response?.data;
	const message = data?.message;
	const errors = data?.errors;

	// If this expectation isn't met we must be doing something wrong
	if (status === undefined || message === undefined) return;

	if (message.includes("Draft pull requests are not supported")) {
		return {
			title: i18nMessage("desktop:errorMap.static6eb697da3"),
			message: i18nMessage("desktop:forge.error.draftUnavailable"),
			error: message,
			style: "danger",
		};
	}

	if (message.includes("enabled OAuth App access restrictions")) {
		return {
			title: i18nMessage("desktop:errorMap.staticf63bc2f3a"),
			message: i18nMessage("desktop:forge.error.oauthRestricted"),
			error: message,
			style: "danger",
		};
	}
	if (message.includes("Validation Failed")) {
		let errorStrings = "";
		if (errors instanceof Array) {
			errorStrings = errors
				.map((err) => {
					if (err.message) return err.message;
					if (err.field && err.code) return `${err.field} ${err.code}`;
					return "unknown validation error";
				})
				.join("\n");
		}
		return {
			title: i18nMessage("desktop:errorMap.static588aa3f9b"),
			message: i18nMessage("desktop:forge.error.validationFailed"),
			error: errorStrings,
			style: "danger",
		};
	}
}
