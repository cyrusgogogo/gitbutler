import { message, type LocalizedText } from "@gitbutler/i18n";
import { Message, useTranslations } from "@gitbutler/i18n/react";
import { formatList } from "@gitbutler/i18n/format";
import { decodeBytes } from "#ui/api/bytes.ts";
import type { DiffSpec, RejectionReason, RejectedChange } from "@gitbutler/but-sdk";
import type { ToastManagerAddOptions } from "@base-ui/react";
import type { FC } from "react";

// oxlint-disable-next-line react/only-export-components -- This private renderer keeps queued toast lists in the current locale.
const Paths: FC<{ paths: Array<string> }> = ({ paths }) => {
	const translations = useTranslations();
	const visible =
		paths.length <= 3
			? paths
			: [...paths.slice(0, 3), translations.t("lite:paths.more", { count: paths.length - 3 })];
	return formatList(translations.locale, visible);
};

const readableRejectionReason = (reason: RejectionReason): LocalizedText => {
	switch (reason) {
		case "cherryPickMergeConflict":
			return message("lite:rejection.Cherrypickmergeconflict");
		case "noEffectiveChanges":
			return message("lite:rejection.Noeffectivechanges");
		case "workspaceMergeConflict":
			return message("lite:rejection.Workspacemergeconflict");
		case "workspaceMergeConflictOfUnrelatedFile":
			return message("lite:rejection.Workspacemergeconflictinanotherfile");
		case "worktreeFileMissingForObjectConversion":
			return message("lite:rejection.Worktreefilemissingforobjectconversion");
		case "fileToLargeOrBinary":
			return message("lite:rejection.Filetoolargeorbinary");
		case "pathNotFoundInBaseTree":
			return message("lite:rejection.Pathnotfoundinbasetree");
		case "unsupportedDirectoryEntry":
			return message("lite:rejection.Unsupporteddirectoryentry");
		case "unsupportedTreeEntry":
			return message("lite:rejection.Unsupportedtreeentry");
		case "missingDiffSpecAssociation":
			return message("lite:rejection.Missingdiffspecassociation");
	}
};

// oxlint-disable-next-line react/only-export-components -- Fix when we tidy up toasts.
const RejectedChanges: FC<{
	rejectedChanges: Array<RejectedChange>;
}> = ({ rejectedChanges }) => {
	const pathsByReason = new Map<RejectionReason, Array<string>>();

	for (const { reason, path } of rejectedChanges) {
		const paths = pathsByReason.get(reason);
		if (paths) paths.push(path);
		else pathsByReason.set(reason, [path]);
	}

	return (
		<ul>
			{pathsByReason
				.entries()
				.toArray()
				.map(([reason, paths]) => (
					<li key={reason}>
						<strong>
							<Message value={readableRejectionReason(reason)} />:
						</strong>{" "}
						<Paths paths={paths} />
					</li>
				))}
		</ul>
	);
};

export const rejectedChangesToastOptions = ({
	newCommit,
	rejectedChanges,
}: {
	newCommit?: string | null;
	rejectedChanges: Array<RejectedChange>;
}): ToastManagerAddOptions<never> => ({
	title: (
		<Message
			value={message(
				newCommit != null ? "lite:rejection.someNotCommitted" : "lite:rejection.commitFailed",
			)}
		/>
	),
	description: <RejectedChanges rejectedChanges={rejectedChanges} />,
	priority: "high",
});

export const discardChangesToastOptions = ({
	rejectedChanges,
}: {
	rejectedChanges: Array<DiffSpec>;
}): ToastManagerAddOptions<never> => ({
	title: <Message value={message("lite:rejection.discardFailed")} />,
	description: <Paths paths={rejectedChanges.map((diffSpec) => decodeBytes(diffSpec.pathBytes))} />,
	priority: "high",
});
