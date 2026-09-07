import { splitMessage } from "$lib/commits/commitMessage";
import { message as i18nMessage } from "@gitbutler/i18n";
import type { RemoteCommit } from "@gitbutler/but-sdk";
import type { LocalizedText } from "@gitbutler/i18n";

export function descriptionTitle(commit: { description: string }): string | undefined {
	return splitMessage(commit.description).title || undefined;
}

export function descriptionBody(commit: { description: string }): string | undefined {
	return splitMessage(commit.description).description || undefined;
}

export function isParentOf(parent: RemoteCommit, possibleChild: RemoteCommit): boolean {
	return possibleChild.parentIds.includes(parent.id);
}

export function isMergeCommit(commit: { parentIds: string[] }): boolean {
	return commit.parentIds.length > 1;
}

export enum CommitStatus {
	LocalOnly = "LocalOnly",
	LocalAndRemote = "LocalAndRemote",
	Integrated = "Integrated",
	Remote = "Remote",
	Base = "Base",
}

export type CommitStatusType = keyof typeof CommitStatus;

export function commitStatusLabel(status: CommitStatusType): LocalizedText {
	switch (status) {
		case CommitStatus.LocalOnly:
			return i18nMessage("desktop:detail.dc99d54d99");
		case CommitStatus.LocalAndRemote:
			return i18nMessage("desktop:detail.2185c2dd43");
		case CommitStatus.Integrated:
			return i18nMessage("desktop:detail.1766eae98d");
		case CommitStatus.Remote:
			return i18nMessage("desktop:detail.c93f6536dc");
		case CommitStatus.Base:
			return i18nMessage("desktop:detail.077fe9c54e");
		default:
			return status;
	}
}
