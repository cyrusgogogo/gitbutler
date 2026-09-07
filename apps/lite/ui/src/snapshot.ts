import { message, type LocalizedText } from "@gitbutler/i18n";
import type { IconName } from "#ui/components/iconNames.ts";
import type { SnapshotDetails } from "@gitbutler/but-sdk";

export const presentableOperation = (
	snapshotDetails: SnapshotDetails | null,
): { text: LocalizedText; icon: IconName } => {
	switch (snapshotDetails?.operation) {
		case "Absorb":
			return { text: message("lite:snapshot.Absorbchangesintocommit"), icon: "absorb" };
		case "AmendCommit":
			return { text: message("lite:snapshot.Amendcommit"), icon: "edit" };
		case "ApplyBranch":
			return { text: message("lite:snapshot.Applybranch"), icon: "branch" };
		case "SwitchBranch":
			return { text: message("lite:snapshot.Switchbranch"), icon: "branch" };
		case "SwitchToWorkspace":
			return { text: message("lite:snapshot.Switchtoworkspace"), icon: "branch" };
		case "AutoCommit":
			return { text: message("lite:snapshot.Autocommitchanges"), icon: "ai" };
		case "AutoHandleChangesAfter":
			return { text: message("lite:snapshot.Handlechangesafteraction"), icon: "refresh" };
		case "AutoHandleChangesBefore":
			return { text: message("lite:snapshot.Handlechangesbeforeaction"), icon: "refresh" };
		case "CherryPick":
			return { text: message("lite:snapshot.Cherrypickcommit"), icon: "commit" };
		case "CleanWorkspace":
			return { text: message("lite:snapshot.Cleanworkspace"), icon: "cross" };
		case "CreateBranch":
			return { text: message("lite:snapshot.Createbranch"), icon: "plus" };
		case "CreateCommit":
			return { text: message("lite:snapshot.Createcommit"), icon: "plus" };
		case "CreateDependentBranch":
			return { text: message("lite:snapshot.Createbranch"), icon: "plus" };
		case "DeleteBranch":
			return { text: message("lite:snapshot.Deletebranch"), icon: "cross" };
		case "Discard":
			return { text: message("lite:snapshot.Discardchanges"), icon: "cross" };
		case "DiscardChanges":
			return { text: message("lite:snapshot.Discardchanges"), icon: "cross" };
		case "DiscardCommit":
			return { text: message("lite:snapshot.Discardcommit"), icon: "cross" };
		case "DiscardFile":
			return { text: message("lite:snapshot.Discardfile"), icon: "cross" };
		case "DiscardHunk":
			return { text: message("lite:snapshot.Discardhunk"), icon: "cross" };
		case "DiscardLines":
			return { text: message("lite:snapshot.Discardlines"), icon: "cross" };
		case "EnterEditMode":
			return { text: message("lite:snapshot.EnterEditMode"), icon: "edit" };
		case "FileChanges":
			return { text: message("lite:snapshot.Filechanges"), icon: "file" };
		case "GenericBranchUpdate":
			return { text: message("lite:snapshot.Genericbranchupdate"), icon: "branch" };
		case "InsertBlankCommit":
			return { text: message("lite:snapshot.Insertblankcommit"), icon: "plus" };
		case "MergeUpstream":
			return { text: message("lite:snapshot.Mergeupstream"), icon: "pr" };
		case "MoveBranch":
			return { text: message("lite:snapshot.Movebranch"), icon: "branch" };
		case "MoveCommit":
			return { text: message("lite:snapshot.Movecommit"), icon: "commit" };
		case "MoveCommitFile":
			return { text: message("lite:snapshot.Movecommitfile"), icon: "commit" };
		case "MoveHunk":
			return { text: message("lite:snapshot.Movehunk"), icon: "file" };
		case "OnDemandSnapshot":
			return {
				text:
					snapshotDetails.body !== null && snapshotDetails.body !== ""
						? message("lite:snapshot.manualNamed", { name: snapshotDetails.body })
						: message("lite:snapshot.manual"),
				icon: "commit",
			};
		case "RemoveDependentBranch":
			return { text: message("lite:snapshot.Removebranch"), icon: "branch" };
		case "ReorderBranches":
			return { text: message("lite:snapshot.Reorderbranches"), icon: "branch" };
		case "ReorderCommit":
			return { text: message("lite:snapshot.Reordercommit"), icon: "commit" };
		case "ResolveConflicts":
			return { text: message("lite:snapshot.Resolveconflicts"), icon: "tick" };
		case "ResolveConflictsAi":
			return { text: message("lite:snapshot.ResolveconflictswithAI"), icon: "ai" };
		case "RestoreFromSnapshot":
			return { text: message("lite:snapshot.Revertsnapshot"), icon: "undo" };
		case "RestoreFromSnapshotViaRedo":
			return { text: message("lite:snapshot.Revertsnapshot"), icon: "undo" };
		case "RestoreFromSnapshotViaUndo":
			return { text: message("lite:snapshot.Revertsnapshot"), icon: "undo" };
		case "SetBaseBranch":
			return { text: message("lite:snapshot.Setbasebranch"), icon: "branch" };
		case "SplitBranch":
			return { text: message("lite:snapshot.Splitbranch"), icon: "branch" };
		case "SquashCommit":
			return { text: message("lite:snapshot.Squashcommit"), icon: "commit" };
		case "StashIntoBranch":
			return { text: message("lite:snapshot.Stashintobranch"), icon: "branch" };
		case "SyncWorkspace":
			return { text: message("lite:snapshot.Syncworkspace"), icon: "refresh" };
		case "TearOffBranch":
			return { text: message("lite:snapshot.Tearoffbranch"), icon: "branch" };
		case "UnapplyBranch":
			return { text: message("lite:snapshot.Unapplybranch"), icon: "branch" };
		case "UndoCommit":
			return { text: message("lite:snapshot.Undocommit"), icon: "undo" };
		case "Unknown":
			return { text: message("lite:snapshot.Unknownoperation"), icon: "commit" };
		case "UpdateBranchName":
			return { text: message("lite:snapshot.Renamebranch"), icon: "edit" };
		case "UpdateBranchNotes":
			return { text: message("lite:snapshot.Updatebranchnotes"), icon: "edit" };
		case "UpdateBranchRemoteName":
			return { text: message("lite:snapshot.Updatebranchremotename"), icon: "edit" };
		case "UpdateCommitMessage":
			return { text: message("lite:snapshot.Updatecommitmessage"), icon: "edit" };
		case "UpdateDependentBranchDescription":
			return { text: message("lite:snapshot.Updatebranchdescription"), icon: "edit" };
		case "UpdateDependentBranchName":
			return { text: message("lite:snapshot.Updatebranchname"), icon: "edit" };
		case "UpdateDependentBranchPrNumber":
			return { text: message("lite:snapshot.Updatebranchpullrequestnumber"), icon: "edit" };
		case "UpdateWorkspaceBase":
			return { text: message("lite:snapshot.Updateworkspacebase"), icon: "refresh" };
		case undefined:
			return { text: message("lite:snapshot.Unknownoperation"), icon: "question" };
	}
};
