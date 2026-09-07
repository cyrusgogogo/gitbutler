import { LocalizedError, type LocalizedText, type MessageDescriptor } from "@gitbutler/i18n";

export class ApiError extends LocalizedError {
	constructor(
		message: string,
		readonly response: Response,
		localized: LocalizedText = message,
	) {
		super(localized, message);
	}
}

export type SerializableError = {
	name: string;
	message: string;
	stack?: string;
	localized?: MessageDescriptor;
};

export function toSerializable(error: unknown): SerializableError {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
			...(error instanceof LocalizedError && typeof error.localized !== "string"
				? { localized: error.localized }
				: {}),
		};
	}

	return {
		name: "Unknown error",
		message: String(error),
	};
}

export type Loadable<T> =
	| { status: "loading" | "not-found" }
	| { status: "found"; value: T }
	| { status: "error"; error: SerializableError };

export type LoadableData<T, Id> = Loadable<T> & { id: Id };
