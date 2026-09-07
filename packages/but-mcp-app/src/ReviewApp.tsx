import { i18n, useHostLanguage } from "./i18n";
import { BranchIcon, CiIcon, ForgeIcon, OpenInBrowserIcon } from "./icons";
import {
	message as i18nMessage,
	errorText,
	type LocalizedText,
	type Locale,
} from "@gitbutler/i18n";
import { formatDate } from "@gitbutler/i18n/format";
import {
	Message as I18nMessage,
	RichMessage as I18nRichMessage,
	useTranslations,
} from "@gitbutler/i18n/react";
import {
	type McpUiToolResultNotification,
	useApp,
	useHostStyles,
} from "@modelcontextprotocol/ext-apps/react";
import { useEffect, useState } from "react";
import type { ForgeInfo } from "@gitbutler/but-sdk";

type ReviewState = "closed" | "draft" | "merged" | "open";

type ReviewPerson = {
	login: string;
	name?: string | null;
};

type ReviewCardData = {
	number: number;
	title: string;
	url: string;
	state: ReviewState;
	sourceBranch: string;
	targetBranch: string;
	author?: ReviewPerson | null;
	reviewers: ReviewPerson[];
	labels: string[];
	createdAt?: string | null;
	canMarkReady: boolean;
	ci: ReviewCi;
};

type ReviewCiStatus =
	| "actionRequired"
	| "cancelled"
	| "failure"
	| "inProgress"
	| "noChecks"
	| "success"
	| "unknown"
	| "unavailable"
	| "unsupported";

type ReviewCi = {
	status: ReviewCiStatus;
	total: number;
	passing: number;
	pending: number;
	failing: number;
	failingCheckNames: string[];
};

type ReviewView = {
	version: number;
	repository: {
		name: string;
		path: string;
	};
	forge: ForgeInfo;
	reviews: ReviewCardData[];
};

type ToolResult = McpUiToolResultNotification["params"];
const REVIEW_POLL_INTERVAL_MS = 30_000;

function errorFromToolResult(result: ToolResult): Error {
	const raw = result.content?.find((content) => content.type === "text")?.text;
	return raw === undefined ? i18n.error("mcp:detail.theReviewOperationFailed") : new Error(raw);
}

function reviewViewFromToolResult(result: ToolResult): ReviewView | null {
	const value = result.structuredContent;
	if (
		typeof value !== "object" ||
		value === null ||
		!("repository" in value) ||
		!("forge" in value) ||
		!("reviews" in value)
	) {
		return null;
	}
	return value as ReviewView;
}

function reviewStateLabel(state: ReviewState): LocalizedText {
	switch (state) {
		case "closed":
			return i18nMessage("mcp:detail.closed");
		case "draft":
			return i18nMessage("mcp:detail.draft");
		case "merged":
			return i18nMessage("mcp:detail.merged");
		case "open":
			return i18nMessage("mcp:detail.ready");
	}
}

function displayPerson(person: ReviewPerson): string {
	return person.name?.trim() || `@${person.login}`;
}

function createdLabel(value: string | null | undefined, locale: Locale): string | null {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return formatDate(locale, date, { dateStyle: "medium" });
}

function ciLabel(ci: ReviewCi): LocalizedText {
	switch (ci.status) {
		case "actionRequired":
			return i18nMessage("mcp:detail.actionRequired");
		case "cancelled":
			return i18nMessage("mcp:detail.ciCancelled");
		case "failure":
			return i18nMessage("mcp:detail.ciFailed");
		case "inProgress":
			return i18nMessage("mcp:detail.ciRunning");
		case "noChecks":
			return i18nMessage("mcp:detail.noChecks");
		case "success":
			return i18nMessage("mcp:detail.ciPassed");
		case "unknown":
			return i18nMessage("mcp:detail.ciUnknown");
		case "unavailable":
			return i18nMessage("mcp:detail.ciUnavailable");
		case "unsupported":
			return i18nMessage("mcp:detail.ciUnsupported");
	}
}

function ciIcon(ci: ReviewCi): "cross" | "question" | "spinner" | "tick" | "warning" {
	switch (ci.status) {
		case "success":
			return "tick";
		case "cancelled":
		case "failure":
			return "cross";
		case "inProgress":
			return "spinner";
		case "actionRequired":
			return "warning";
		case "noChecks":
		case "unknown":
		case "unavailable":
		case "unsupported":
			return "question";
	}
}

function ciTitle(ci: ReviewCi, messages: ReturnType<typeof useTranslations>): string {
	if (ci.status === "failure" && ci.failingCheckNames.length > 0)
		return messages.t("mcp:detail.failedChecksValue", { checks: ci.failingCheckNames.join(", ") });
	const status = messages.text(ciLabel(ci));
	return ci.total > 0
		? messages.t("mcp:detail.valueValuePassedValuePendingValueFailed", {
				status,
				passing: ci.passing,
				pending: ci.pending,
				failing: ci.failing,
			})
		: status;
}

function CiStatus({ ci }: { ci: ReviewCi }) {
	const i18nMessages = useTranslations();
	if (ci.status === "unsupported") return null;

	return (
		<span className="ci-status" data-state={ci.status} title={ciTitle(ci, i18nMessages)}>
			<CiIcon kind={ciIcon(ci)} />
			<span>{i18nMessages.text(ciLabel(ci))}</span>
		</span>
	);
}

function shouldPollReview(review: ReviewCardData): boolean {
	const isOpen = review.state === "draft" || review.state === "open";
	return (
		isOpen &&
		review.ci.status !== "failure" &&
		review.ci.status !== "unavailable" &&
		review.ci.status !== "unsupported"
	);
}

function mergeReviewViews(current: ReviewView, update: ReviewView): ReviewView {
	const updatedByNumber = new Map(update.reviews.map((review) => [review.number, review]));
	return {
		...current,
		forge: update.forge,
		reviews: current.reviews.map((review) => updatedByNumber.get(review.number) ?? review),
	};
}

function ReviewCard({
	review,
	forge,
	canCallTools,
	pending,
	onMarkReady,
	onOpen,
}: {
	review: ReviewCardData;
	forge: ForgeInfo;
	canCallTools: boolean;
	pending: boolean;
	onMarkReady: () => void;
	onOpen: () => void;
}) {
	const i18nMessages = useTranslations();
	const created = createdLabel(review.createdAt, i18nMessages.locale);

	return (
		<article className="review-card">
			<header className="review-card-header">
				<div className="review-identity">
					<ForgeIcon className="forge-icon" name={forge.name} />
					<span>
						{forge.unit.abbr} {forge.unit.symbol}
						{review.number}
					</span>
				</div>
				<div className="review-card-controls">
					<CiStatus ci={review.ci} />
					<span className="review-status" data-state={review.state}>
						{i18nMessages.text(reviewStateLabel(review.state))}
					</span>
					<button
						className="icon-button"
						disabled={pending}
						onClick={onOpen}
						type="button"
						title={i18nMessages.t("mcp:ReviewApp.openValueInBrowser", { value: forge.unit.abbr })}
						aria-label={i18nMessages.t("mcp:ReviewApp.openValueInBrowser", {
							value: forge.unit.abbr,
						})}
					>
						<OpenInBrowserIcon />
					</button>
				</div>
			</header>

			<h2>{review.title}</h2>

			<div
				className="branch-flow"
				title={i18nMessages.t("mcp:ReviewApp.valueValue", {
					value: review.sourceBranch,
					value1: review.targetBranch,
				})}
			>
				<BranchIcon />
				<code>{review.sourceBranch}</code>
				<svg className="branch-arrow" viewBox="0 0 16 16" aria-hidden="true">
					<path d="M3 8h9M9 4l4 4-4 4" />
				</svg>
				<code>{review.targetBranch}</code>
			</div>

			<div className="review-facts">
				<span>
					{review.author ? (
						displayPerson(review.author)
					) : (
						<I18nMessage value={{ key: "mcp:ReviewApp.unknownAuthor" }} />
					)}
				</span>
				<span aria-hidden="true">·</span>
				<span>{i18nMessages.t("mcp:detail.reviewers", { count: review.reviewers.length })}</span>
				{created && (
					<>
						<span aria-hidden="true">·</span>
						<span>{created}</span>
					</>
				)}
			</div>

			{review.labels.length > 0 && (
				<div className="review-labels" aria-label={i18nMessages.t("mcp:ReviewApp.labels")}>
					{review.labels.map((label) => (
						<span key={label}>{label}</span>
					))}
				</div>
			)}

			<footer className="review-actions">
				{review.canMarkReady && canCallTools && (
					<button
						className="review-button primary"
						disabled={pending}
						onClick={onMarkReady}
						type="button"
					>
						{pending && <span className="spinner" aria-hidden="true" />}
						{pending ? (
							<I18nMessage value={{ key: "mcp:ReviewApp.markingReady" }} />
						) : (
							<I18nMessage value={{ key: "mcp:ReviewApp.readyForReview" }} />
						)}
					</button>
				)}
			</footer>
		</article>
	);
}

export function ReviewApp() {
	const i18nMessages = useTranslations();
	const [view, setView] = useState<ReviewView | null>(null);
	const [resultError, setResultError] = useState<LocalizedText | null>(null);
	const [actionError, setActionError] = useState<LocalizedText | null>(null);
	const [pollingError, setPollingError] = useState<LocalizedText | null>(null);
	const [pendingReview, setPendingReview] = useState<number | null>(null);
	const { app, isConnected, error } = useApp({
		appInfo: { name: "GitButler review", version: "1.0.0" },
		capabilities: {},
		onAppCreated: (createdApp) => {
			createdApp.addEventListener("toolresult", (result) => {
				if (result.isError) {
					setResultError(errorText(errorFromToolResult(result), ""));
					return;
				}
				const nextView = reviewViewFromToolResult(result);
				if (nextView === null) {
					setResultError(i18nMessage("mcp:detail.theReviewResultDidNotContainStructuredData"));
					return;
				}
				setView(nextView);
				setResultError(null);
				setPollingError(null);
			});
		},
	});
	useHostStyles(app, app?.getHostContext());
	useHostLanguage(app, isConnected);

	useEffect(() => {
		if (
			app === null ||
			view === null ||
			pollingError !== null ||
			app.getHostCapabilities()?.serverTools === undefined
		) {
			return;
		}

		const reviewNumbers = view.reviews.filter(shouldPollReview).map((review) => review.number);
		if (reviewNumbers.length === 0) return;

		let cancelled = false;

		async function refreshReviews() {
			try {
				const result = await app?.callServerTool({
					name: "gitbutler_refresh_reviews",
					arguments: {
						repository: view?.repository.path,
						reviewNumbers,
					},
				});
				if (cancelled || result === undefined) return;
				if (result.isError) throw errorFromToolResult(result);
				const refreshed = reviewViewFromToolResult(result);
				if (refreshed === null) {
					throw i18n.error("mcp:detail.theRefreshedReviewsWereMissingFromTheResponse");
				}
				setView((current) => (current === null ? current : mergeReviewViews(current, refreshed)));
			} catch (pollCause) {
				if (cancelled) return;
				setPollingError(errorText(pollCause, i18nMessage("mcp:detail.couldNotRefreshCIStatus")));
			}
		}

		const timeout = window.setTimeout(() => void refreshReviews(), REVIEW_POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			window.clearTimeout(timeout);
		};
	}, [app, pollingError, view]);

	if (error !== null) {
		return (
			<div className="message-state error-state">
				<I18nMessage
					value={{
						key: "mcp:ReviewApp.couldNotConnectToTheHostValue",
						values: { message: String(error.message) },
					}}
				/>
			</div>
		);
	}
	if (resultError !== null) {
		return (
			<div className="message-state error-state">
				<I18nMessage value={resultError} />
			</div>
		);
	}
	if (!isConnected || view === null || app === null) {
		return (
			<div className="message-state loading-state">
				<I18nRichMessage
					value={{ key: "mcp:ReviewApp.loadingGitButlerReview" }}
					components={{ slot1: <span className="spinner" aria-hidden="true" /> }}
				/>{" "}
			</div>
		);
	}

	const connectedApp = app;
	const currentView = view;
	const canCallTools = connectedApp.getHostCapabilities()?.serverTools !== undefined;

	async function markReady(review: ReviewCardData) {
		setPendingReview(review.number);
		setActionError(null);
		try {
			const result = await connectedApp.callServerTool({
				name: "gitbutler_mark_review_ready",
				arguments: {
					repository: currentView.repository.path,
					reviewNumber: review.number,
				},
			});
			if (result.isError) throw errorFromToolResult(result);
			const updatedView = reviewViewFromToolResult(result);
			const updatedReview = updatedView?.reviews[0];
			if (!updatedReview) throw i18n.error("mcp:detail.theUpdatedReviewWasMissingFromTheResponse");
			setView((current) =>
				current === null || updatedView === null ? current : mergeReviewViews(current, updatedView),
			);
		} catch (actionCause) {
			setActionError(errorText(actionCause, i18nMessage("mcp:detail.couldNotMarkTheReviewReady")));
		} finally {
			setPendingReview(null);
		}
	}

	async function openReview(review: ReviewCardData) {
		setActionError(null);
		try {
			await connectedApp.openLink({ url: review.url });
		} catch (actionCause) {
			setActionError(errorText(actionCause, i18nMessage("mcp:detail.couldNotOpenTheReview")));
		}
	}

	return (
		<main className="review-shell">
			<header className="review-context">
				<div>
					<span className="eyebrow">
						<I18nMessage value={{ key: "mcp:ReviewApp.gitButlerReview" }} />
					</span>
					<h1>{view.repository.name}</h1>
				</div>
				<span className="review-count">
					<I18nMessage
						value={{ key: "mcp:review.count", values: { count: view.reviews.length } }}
					/>
				</span>
			</header>

			{actionError && (
				<div className="action-error" role="alert">
					<I18nMessage value={actionError} />
				</div>
			)}
			{pollingError && (
				<div className="polling-error" role="status">
					<I18nMessage
						value={{
							key: "mcp:ReviewApp.cIStatusStoppedUpdatingValue",
							values: { pollingError: i18nMessages.text(pollingError) },
						}}
					/>
				</div>
			)}

			<div className="review-list">
				{view.reviews.map((review) => (
					<ReviewCard
						key={review.number}
						review={review}
						forge={view.forge}
						canCallTools={canCallTools}
						pending={pendingReview === review.number}
						onMarkReady={() => void markReady(review)}
						onOpen={() => void openReview(review)}
					/>
				))}
			</div>
		</main>
	);
}
