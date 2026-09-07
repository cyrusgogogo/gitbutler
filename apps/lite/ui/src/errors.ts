import { LocalizedError, message, type LocalizedText } from "@gitbutler/i18n";
export const errorMessageForToast = (error: unknown): LocalizedText => {
	if (error instanceof LocalizedError) return error.localized;
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;

	try {
		// JSON.stringify returns undefined for values such as functions and symbols.
		const serialized = JSON.stringify(error) as string | undefined;
		return serialized ?? message("common:unknownError");
	} catch {
		return message("common:unknownError");
	}
};
