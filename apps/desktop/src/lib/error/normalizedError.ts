import type { Code } from "@gitbutler/but-sdk";

/** Error shape shared by IPC, HTTP, and frontend callers. */
export type NormalizedError = {
	origin?: "ipc" | "http" | "frontend" | "unknown";
	name?: string;
	message: string;
	code?: Code;
};

export function isNormalizedError(something: unknown): something is NormalizedError {
	if (!something || typeof something !== "object") return false;
	const r = something as NormalizedError;
	return (
		typeof r.message === "string" &&
		(r.name === undefined || typeof r.name === "string") &&
		(r.code === undefined || typeof r.code === "string")
	);
}

/** Preserve the backend message and code in a real Error with the caller's stack. */
export class IpcError extends Error implements NormalizedError {
	override readonly name: string;
	override readonly message: string;
	readonly code?: Code;
	readonly origin = "ipc" as const;

	constructor(raw: NormalizedError, command: string) {
		super(raw.message);
		this.name = raw.name ?? `API error: (${command})`;
		// Keep message enumerable for local logs and plain-object IPC consumers.
		this.message = raw.message;
		this.code = raw.code;
	}
}
