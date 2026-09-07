import { showWarning } from "$lib/notifications/toasts";
import { message as i18nMessage } from "@gitbutler/i18n";
import { TestId } from "@gitbutler/ui";
import type { BranchIconName } from "$lib/branches/branchIcon";
import type { DropResult } from "$lib/dragging/dropResult";
import type { ApplyOutcome, PushStatus, Segment, Stack as RefInfoStack } from "@gitbutler/but-sdk";

export function handleApplyOutcome(outcome: ApplyOutcome) {
	if (outcome.status !== "conflictAborted") return;
	const names = outcome.conflictingStacks.map((stack) => stack.shortName);

	showWarning(
		i18nMessage("desktop:stack.couldnTApplyBranchDueToConflicts"),
		names.length
			? i18nMessage("desktop:stack.conflict", { count: names.length, names: names.join(", ") })
			: i18nMessage("desktop:stack.conflictUnknown"),
		undefined,
		TestId.BranchApplyConflictToast,
	);
}

export type Stack = RefInfoStack;

export type GerritPushFlag =
	| { type: "wip" }
	| { type: "ready" }
	| { type: "private" }
	| { type: "hashtag"; subject: string }
	| { type: "topic"; subject: string };

/**
 * Returns the name of the stack.
 *
 * This is the name of the top-most branch in the stack.
 */
export function getStackName(stack: Stack, unnamed = "Unnamed segment"): string {
	const firstSegment = stack.segments.at(0);
	if (!firstSegment?.refName) {
		return unnamed;
	}
	return firstSegment.refName.displayName;
}

/** A stack a commit can be cherry-picked onto, identified by its top branch. */
export type CherryPickTarget = {
	branchName: string;
	branchCount: number;
};

/**
 * Returns the stacks a commit can be cherry-picked onto.
 *
 * A cherry-pick is placed relative to the top branch's reference, so stacks
 * whose top segment lost its name are not targetable and are left out.
 */
export function cherryPickTargets(stacks: Stack[]): CherryPickTarget[] {
	return stacks.flatMap((stack) => {
		const branchName = stack.segments.at(0)?.refName?.displayName;
		if (!branchName) return [];
		return [{ branchName, branchCount: stack.segments.length }];
	});
}

export function getStackBranchNames(stack: Stack, unnamed = "Unnamed segment"): string[] {
	return stack.segments.map((segment) => {
		if (!segment.refName) {
			return unnamed;
		}
		return segment.refName.displayName;
	});
}

/**
 * Converts push status directly to a CSS color string.
 */
export function getColorFromPushStatus(pushStatus: PushStatus): string {
	switch (pushStatus) {
		case "nothingToPush":
		case "unpushedCommits":
		case "unpushedCommitsRequiringForce":
			return "var(--commit-remote)";
		case "completelyUnpushed":
			return "var(--commit-local)";
		case "integrated":
			return "var(--commit-integrated)";
	}
}

export function pushStatusToIcon(pushStatus: PushStatus): BranchIconName {
	switch (pushStatus) {
		case "nothingToPush":
		case "unpushedCommits":
		case "unpushedCommitsRequiringForce":
			return "branch";
		case "completelyUnpushed":
			return "branch-local";
		case "integrated":
			return "branch";
	}
}

export function stackRequiresForcePush(stack: Stack): boolean {
	return stack.segments.at(0)?.pushStatus === "unpushedCommitsRequiringForce";
}

export function branchRequiresForcePush(branch: Segment): boolean {
	return branch.pushStatus === "unpushedCommitsRequiringForce";
}

export function stackHasConflicts(stack: Stack): boolean {
	return stack.segments.at(0)?.commits.some((commit) => commit.hasConflicts) ?? false;
}

export function branchHasConflicts(branch: Segment): boolean {
	return branch.commits.some((commit) => commit.hasConflicts);
}

export function stackHasUnpushedCommits(stack: Stack): boolean {
	const pushStatus = stack.segments.at(0)?.pushStatus;
	return pushStatus ? requiresPush(pushStatus) : false;
}

export function branchHasUnpushedCommits(branch: Segment): boolean {
	return requiresPush(branch.pushStatus);
}

export function requiresPush(status: PushStatus): boolean {
	return (
		status === "unpushedCommits" ||
		status === "unpushedCommitsRequiringForce" ||
		status === "completelyUnpushed"
	);
}

/**
 * Converts an unapplied-stack count into a `DropResult` warning if stacks were unapplied.
 */
export function toMoveBranchWarning(unappliedStackCount: number): DropResult | undefined {
	if (unappliedStackCount === 0) return undefined;
	return {
		type: "warning",
		title: i18nMessage("desktop:stack.static608dcad83"),
		message: i18nMessage("desktop:stack.moveWarning", { count: unappliedStackCount }),
		testId: TestId.StacksUnappliedToast,
	};
}
