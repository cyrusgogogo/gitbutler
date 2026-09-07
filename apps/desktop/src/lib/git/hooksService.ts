import { SilentError } from "$lib/error/error";
import { showWarning } from "$lib/notifications/toasts";
import { InjectionToken } from "@gitbutler/core/context";
import { message as i18nMessage } from "@gitbutler/i18n";
import { chipToasts } from "@gitbutler/ui";
import type { BackendApi } from "$lib/state/backendApi";
import type { DiffSpec } from "@gitbutler/but-sdk";
import type { LocalizedText } from "@gitbutler/i18n";

export const HOOKS_SERVICE = new InjectionToken<HooksService>("HooksService");

export class HooksService {
	constructor(private backendApi: BackendApi) {}

	get message() {
		return this.backendApi.endpoints.messageHook.useMutation();
	}

	// Promise-based wrapper methods with toast handling
	async runPreCommitHooks(projectId: string, changes: DiffSpec[]): Promise<void> {
		const loadingToastId = chipToasts.loading(
			i18nMessage("desktop:hooksService.startedPreCommitHooks"),
		);

		try {
			const result = await this.backendApi.endpoints.preCommitDiffspecs.mutate({
				projectId,
				changes,
			});

			if (result?.status === "failure") {
				chipToasts.removeChipToast(loadingToastId);
				showWarning(
					i18nMessage("desktop:hooksService.preCommitHookFailed"),
					formatError(result.error),
				);
				throw new HookFailedError();
			}

			chipToasts.removeChipToast(loadingToastId);
			chipToasts.success(i18nMessage("desktop:hooksService.preCommitHooksSucceeded"));
		} catch (e: unknown) {
			chipToasts.removeChipToast(loadingToastId);
			throw e;
		}
	}

	async runPostCommitHooks(projectId: string): Promise<void> {
		const loadingToastId = chipToasts.loading(
			i18nMessage("desktop:hooksService.startedPostCommitHooks"),
		);

		try {
			const result = await this.backendApi.endpoints.postCommit.mutate({
				projectId,
			});

			if (result?.status === "failure") {
				chipToasts.removeChipToast(loadingToastId);
				showWarning(
					i18nMessage("desktop:hooksService.postCommitHookFailed"),
					formatError(result.error),
				);
				return;
			}

			chipToasts.removeChipToast(loadingToastId);
			chipToasts.success(i18nMessage("desktop:hooksService.postCommitHooksSucceeded"));
		} catch (e: unknown) {
			chipToasts.removeChipToast(loadingToastId);
			console.error("Post-commit hook error:", e);
		}
	}
}

/**
 * Thrown after a hook failure warning has already been shown.
 * Extends `SilentError` so the classifier suppresses any toast that
 * would otherwise reach the user a second time.
 */
export class HookFailedError extends SilentError {
	constructor() {
		super("Git hook failed");
		this.name = "HookFailedError";
	}
}

function formatError(error: string): LocalizedText {
	return i18nMessage("desktop:hooks.failureGuidance", { error });
}
