import {
	getSwallowGitHubOrgAuthErrors,
	persistSwallowGitHubOrgAuthErrors,
} from "$lib/config/config";
import { SilentError } from "$lib/error/error";
import { parseError } from "$lib/error/parser";
import { LocalizedError, message as i18nMessage } from "@gitbutler/i18n";
import type { Code } from "@gitbutler/but-sdk";
import type { LocalizedText } from "@gitbutler/i18n";

export type Severity = "error" | "warning" | "silent";

export type ActionHint = {
	label: LocalizedText;
	/** `dismiss` closes the toast the action was clicked on. */
	onClick: (dismiss: () => void) => void;
};

/**
 * UX classification for a backend error. Keyed by `Code` in the
 * `CLASSIFICATIONS` table below.
 *
 * `severity` drives the toast style and which capture event fires:
 * `error` → danger style + Sentry capture; `warning` → warning style,
 * no Sentry; `silent` → suppress the toast and capture entirely.
 *
 * `userMessage` is the long-form, user-facing description rendered in
 * the toast body. `actionHint` adds an optional CTA button.
 */
export type Classification = {
	severity: Severity;
	/**
	 * Replaces the error's own name as the toast/capture title. IPC errors
	 * all arrive named `API error: (<command>)`, so a code that identifies
	 * a specific condition needs this to surface under a stable title.
	 */
	title?: LocalizedText;
	/**
	 * A persistent environment state rather than a one-off defect —
	 * repeated occurrences carry no new information, so telemetry
	 * captures it once per session instead of once per occurrence.
	 */
	terminal?: boolean;
	userMessage?: LocalizedText;
	actionHint?: ActionHint;
};

export type ClassifiedError = {
	title: LocalizedText;
	message: string;
	code?: Code;
	severity: Severity;
	terminal?: boolean;
	userMessage?: LocalizedText;
	actionHint?: ActionHint;
};

const GH_ORG_AUTH_ERROR = i18nMessage("desktop:errorClassification.gitHubOrganizationsOAuthError");

/**
 * A GitHub organization has blocked the GitButler OAuth app. Terminal
 * until the org approves the app or the user switches credentials, and
 * `list_reviews` polling keeps rediscovering it — the action lets the
 * user opt out of repeats (honoured by the swallow check in `classify`).
 *
 * Shared between the code-keyed entry (IPC errors, tagged by the
 * backend) and the message-pattern entry (octokit errors, which never
 * pass through the backend and so carry no code).
 */
const GH_ORG_AUTH_CLASSIFICATION: Classification = {
	severity: "error",
	terminal: true,
	title: GH_ORG_AUTH_ERROR,
	actionHint: {
		label: i18nMessage("desktop:errorClassification.donTShowThisAgain"),
		onClick: (dismiss) => {
			persistSwallowGitHubOrgAuthErrors(true);
			dismiss();
		},
	},
	userMessage: i18nMessage(
		"desktop:errorClassification.aGitHubOrganizationHasRestrictedAccessForThe",
	),
};

/**
 * Terminal GitHub device-flow outcomes, tagged by `but-github` with a
 * static message. The settings OAuth flow shows this guidance verbatim
 * through `classifyGitHubDeviceOAuthFailure`; pending statuses are not
 * tagged and keep the generic fallback.
 */
const GITHUB_DEVICE_OAUTH_CLASSIFICATIONS = {
	GitHubDeviceCodeExpired: {
		severity: "warning",
		userMessage: i18nMessage("desktop:errorClassification.theGitHubDeviceCodeHasExpiredStartThe"),
	},
	GitHubDeviceAccessDenied: {
		severity: "warning",
		userMessage: i18nMessage(
			"desktop:errorClassification.theAuthorizationRequestWasDeniedOnGitHubStart",
		),
	},
	GitHubDeviceFlowRejected: {
		severity: "error",
		userMessage: i18nMessage(
			"desktop:errorClassification.gitHubRejectedTheDeviceAuthorizationRequestStartAgain",
		),
	},
} satisfies Partial<Record<Code, Classification & { userMessage: LocalizedText }>>;

export type GitHubDeviceOAuthFailure = { message: LocalizedText; code?: Code; severity: Severity };

/**
 * A fixed, safe description of a failed device-OAuth step: the static guidance
 * for one of the device-flow codes above, or a generic label with no code.
 * Total over any throwable — the parser is not — and never echoes the raw
 * message, which can carry device codes or request detail.
 */
export function classifyGitHubDeviceOAuthFailure(error: unknown): GitHubDeviceOAuthFailure {
	try {
		const { code } = classify(error);
		if (code && Object.hasOwn(GITHUB_DEVICE_OAUTH_CLASSIFICATIONS, code)) {
			const { userMessage, severity } =
				GITHUB_DEVICE_OAUTH_CLASSIFICATIONS[
					code as keyof typeof GITHUB_DEVICE_OAUTH_CLASSIFICATIONS
				];
			return { message: userMessage, code, severity };
		}
	} catch {
		// Fall through to the generic label.
	}
	return {
		message: i18nMessage("desktop:errorClassification.gitHubAuthenticationFailed"),
		severity: "error",
	};
}

/**
 * Per-`Code` presentation rules. This table is the single source of
 * truth for "how should a backend error code show up to users?" — add
 * a code-keyed entry here rather than special-casing inside callers
 * or `showError`.
 *
 * `userMessage` long-form text used to live in `knownErrors.ts`; it's
 * folded in here so severity, copy, and action live together.
 */
const CLASSIFICATIONS: Partial<Record<Code, Classification>> = {
	PreconditionFailed: {
		severity: "warning",
	},
	/**
	 * Transport-level failure reaching a forge (DNS, timeout, connection
	 * refused). The user is effectively offline; surfacing a toast every
	 * time a polled `list_reviews` round-trip fails is just noise.
	 */
	NetworkError: {
		severity: "silent",
	},
	/**
	 * Auto-fetch / fetch-from-remotes failure caused by missing
	 * credentials. Soft style — the user can fix it from project settings.
	 */
	ProjectGitAuth: {
		severity: "warning",
		userMessage: i18nMessage(
			"desktop:errorClassification.authenticationFailedCheckThatYourGitCredentialsAre",
		),
	},
	/**
	 * Surfaced when there's no default target — the workspace router
	 * sends the user to the project-setup page, so a toast on top of
	 * that would be redundant noise.
	 */
	DefaultTargetNotFound: {
		severity: "silent",
	},
	CommitSigningFailed: {
		severity: "error",
		userMessage: i18nMessage(
			"desktop:errorClassification.commitSigningFailedAndHasNowBeenDisabled",
		),
	},
	RepoOwnership: {
		severity: "error",
		userMessage: i18nMessage(
			"desktop:errorClassification.theRepositoryOwnershipCouldnTBeDeterminedConsider",
		),
	},
	SecretKeychainNotFound: {
		severity: "error",
		userMessage: i18nMessage("desktop:errorClassification.pleaseInstallAKeychainServiceToStoreAnd"),
	},
	MissingLoginKeychain: {
		severity: "error",
		userMessage: i18nMessage(
			"desktop:errorClassification.missingDefaultKeychainWithSeahorseOrEquivalentCreate",
		),
	},
	GitHubTokenExpired: {
		severity: "error",
		terminal: true,
		userMessage: i18nMessage(
			"desktop:errorClassification.yourGitHubTokenAppearsExpiredPleaseLogOut",
		),
	},
	...GITHUB_DEVICE_OAUTH_CLASSIFICATIONS,
	GitHubOrgOAuthRestricted: GH_ORG_AUTH_CLASSIFICATION,
	GitHubOrgSamlRestricted: {
		severity: "error",
		terminal: true,
		title: i18nMessage("desktop:errorClassification.gitHubSAMLSSOAuthorizationRequired"),
		userMessage: i18nMessage(
			"desktop:errorClassification.thisGitHubOrganizationRequiresSAMLSSOAuthorizeThe",
		),
	},
	/**
	 * GitHub denied or hid the requested repository resource. Terminal until
	 * the user grants access, reconnects, or updates the repository configuration.
	 */
	GitHubInsufficientPermissions: {
		severity: "error",
		terminal: true,
		title: i18nMessage("desktop:errorClassification.gitHubPermissionsError"),
		userMessage: i18nMessage(
			"desktop:errorClassification.gitHubCouldNotAccessThisRepositoryOrPart",
		),
	},
	/**
	 * No forge credentials are stored — the user never authenticated or
	 * logged out. Cached review reads fall back to the last known data;
	 * this surfaces on explicit forge actions (sync, PR mutations), so
	 * the copy stays operation-neutral.
	 */
	ForgeNotAuthenticated: {
		severity: "warning",
		terminal: true,
		userMessage: i18nMessage("desktop:errorClassification.youAreNotLoggedInToYourForge"),
	},
	/**
	 * The target remote maps to no supported forge, so `list_reviews` has
	 * nothing to poll. Terminal until the target or remote changes; not
	 * silent, so an explicit Sync still explains why nothing was listed.
	 */
	ForgeUnrecognized: {
		severity: "warning",
		terminal: true,
		userMessage: i18nMessage("desktop:errorClassification.theTargetBranchSRemoteIsnTA"),
	},
	ProjectDatabaseIncompatible: {
		severity: "error",
		userMessage: i18nMessage("desktop:errorClassification.theDatabaseWasChangedByAMoreRecent"),
	},
	DefaultTerminalNotFound: {
		severity: "error",
		userMessage: i18nMessage(
			"desktop:errorClassification.yourDefaultTerminalWasNotFoundPleaseSelect",
		),
	},
};

/**
 * Vite occasionally produces this unrecoverable bundling failure; the
 * resolution is a manual cache-disable and reload. Surfacing it as a
 * toast or capturing it just produces noise.
 */
function isUnrecoverableBundlingError(message: string): boolean {
	return message.startsWith("undefined is not an object (evaluating 'first_child_getter.call')");
}

/**
 * Message-pattern rules for cases where `Code` alone isn't specific
 * enough — e.g. a generic `Unknown` code whose `message` body
 * identifies a known dev-environment problem. Checked before the
 * code-keyed table, so a pattern match wins when both apply.
 *
 * Keep this list short; reach for a real `Code` first if at all
 * possible.
 */
const MESSAGE_PATTERNS: ReadonlyArray<{
	matches: (parsed: { code?: Code; message: string }) => boolean;
	classification: Classification;
}> = [
	{
		matches: ({ code, message }) =>
			code === "Unknown" && message.includes("cargo build -p gitbutler-git"),
		classification: {
			severity: "error",
			userMessage: i18nMessage(
				"desktop:errorClassification.theGitbutlerGitBinaryIsMissingRunCargo",
			),
		},
	},
	{
		matches: ({ message }) =>
			message.startsWith("Although you appear to have the correct authorization credentials,"),
		classification: GH_ORG_AUTH_CLASSIFICATION,
	},
];

/**
 * Combine the parsed error with the per-code classification table
 * and title/message heuristics into a single presentation decision.
 *
 * Returns `severity: 'silent'` for anything that should not surface
 * (bundling noise, `SilentError`, the parser's "Load failed" ignore,
 * or a previously-opted-out GitHub-org-auth error).
 */
export function classify(error: unknown, callerTitle?: LocalizedText): ClassifiedError {
	if (error instanceof SilentError) {
		return {
			title: callerTitle ?? error.name,
			message: error.message,
			severity: "silent",
		};
	}

	const { name, message, code, origin } = parseError(error);
	const byMessage = MESSAGE_PATTERNS.find((p) => p.matches({ code, message }))?.classification;
	const byCode = code ? CLASSIFICATIONS[code] : undefined;
	const effective = byMessage ?? byCode;
	const title = effective?.title ?? name ?? callerTitle ?? message;

	// Expected states rather than defects: suppress the toast and capture,
	// but carry `terminal` through so pollers still stop on unretryable
	// states (e.g. an org-auth error the user opted out of seeing).
	const silenced =
		isUnrecoverableBundlingError(message) ||
		// Octokit's offline "Load failed" — happens whenever the user
		// loses network, surfaces nothing actionable.
		(origin === "http" && message === "Load failed") ||
		// The org-auth toast opt-out ("Don't show this again").
		(title === GH_ORG_AUTH_ERROR && getSwallowGitHubOrgAuthErrors()) ||
		effective?.severity === "silent";
	if (silenced) {
		return { title, message, code, severity: "silent", terminal: effective?.terminal };
	}

	return {
		title,
		message,
		code,
		severity: effective?.severity ?? "error",
		terminal: effective?.terminal,
		userMessage: error instanceof LocalizedError ? error.localized : effective?.userMessage,
		actionHint: effective?.actionHint,
	};
}
