import { goto } from "$app/navigation";
import { showToast, showWarning } from "$lib/notifications/toasts";
import { projectPath } from "$lib/routes/routes.svelte";
import { message as i18nMessage } from "@gitbutler/i18n";
import { TestId } from "@gitbutler/ui";
// Inlined to avoid circular import with forge/.
type ForgeName = "github" | "gitlab" | "bitbucket" | "azure" | "default";
import type { ApiProject, ForgeUser } from "@gitbutler/but-sdk";

export type Project = {
	id: string;
	title: string;
	description?: string;
	path: string;
	git_dir?: string;
	api?: ApiProject;
	ok_with_force_push: boolean;
	force_push_protection: boolean;
	husky_hooks_enabled: boolean;
	omit_certificate_check: boolean | undefined;
	use_diff_context: boolean | undefined;
	// Produced just for the frontend to determine if the project is open in any window.
	is_open: boolean;
	forge_override: ForgeName | undefined;
	preferred_forge_user: ForgeUser | null;
	// Gerrit mode enabled for this project, derived from git configuration
	gerrit_mode: boolean;
	/**
	 * The path to the forge review template, if set in git configuration.
	 */
	forge_review_template_path: string | null;
};

export function vscodePath(path: string) {
	return path.includes("\\") ? "/" + path.replace("\\", "/") : path;
}

export type AddProjectOutcome =
	| {
			type: "added";
			subject: Project;
	  }
	| {
			type: "alreadyExists";
			subject: Project;
	  }
	| {
			type: "pathNotFound";
	  }
	| {
			type: "notADirectory";
	  }
	| {
			type: "bareRepository";
	  }
	| {
			type: "nonMainWorktree";
	  }
	| {
			type: "noWorkdir";
	  }
	| {
			type: "noDotGitDirectory";
	  }
	| {
			type: "reftableRefFormatUnsupported";
	  }
	| {
			type: "notAGitRepository";
			/**
			 * The error message received
			 */
			subject: string;
	  };

/**
 * Correctly handle the outcome of an addProject operation by passing the project to the callback or
 * showing toasts as necessary.
 */
export function handleAddProjectOutcome(
	outcome: AddProjectOutcome,
	onAdded?: (project: Project) => void,
): true {
	switch (outcome.type) {
		case "added":
			onAdded?.(outcome.subject);
			return true;
		case "alreadyExists":
			showWarning(
				i18nMessage("desktop:project.projectValueAlreadyExists", {
					title: String(outcome.subject.title),
				}),
				i18nMessage("desktop:project.theProjectAtValueIsAlreadyAdded", {
					path: String(outcome.subject.path),
				}),
				{
					label: i18nMessage("desktop:project.openProject"),
					testId: TestId.AddProjectAlreadyExistsModalOpenProjectButton,
					onClick: (dismiss) => {
						goto(projectPath(outcome.subject.id));
						dismiss();
					},
				},
				TestId.AddProjectAlreadyExistsModal,
			);
			return true;
		case "pathNotFound":
			showWarning(
				i18nMessage("desktop:project.pathNotFound"),
				i18nMessage("desktop:project.theSpecifiedPathDoesNotExistOnThe"),
			);
			return true;
		case "notADirectory":
			showWarning(
				i18nMessage("desktop:project.notADirectory"),
				i18nMessage("desktop:project.theSpecifiedPathIsNotADirectory"),
			);
			return true;
		case "bareRepository":
			showToast({
				testId: TestId.AddProjectBareRepoModal,
				style: "danger",
				title: i18nMessage("desktop:project.bareRepository"),
				message: i18nMessage("desktop:project.theSpecifiedPathAppearsToBeABare"),
			});
			return true;
		case "nonMainWorktree":
			showWarning(
				i18nMessage("desktop:project.nonMainWorktree"),
				i18nMessage("desktop:project.theSpecifiedPathIsNotTheMainWorktree"),
			);
			return true;
		case "noWorkdir":
			showWarning(
				i18nMessage("desktop:project.noWorkdir"),
				i18nMessage("desktop:project.theSpecifiedRepositoryDoesNotHaveAWorking"),
			);
			return true;
		case "noDotGitDirectory":
			showWarning(
				i18nMessage("desktop:project.noGitDirectory"),
				i18nMessage("desktop:project.theSpecifiedPathDoesNotContainAGit"),
				undefined,
				TestId.AddProjectNoDotGitDirectoryModal,
			);
			return true;
		case "reftableRefFormatUnsupported":
			showWarning(
				i18nMessage("desktop:project.unsupportedReferenceFormat"),
				i18nMessage("desktop:project.gitButlerDoesNotSupportRepositoriesUsingTheReftable"),
			);
			return true;
		case "notAGitRepository":
			showWarning(
				i18nMessage("desktop:project.notAGitRepository"),
				i18nMessage("desktop:project.unableToAddProjectValue", {
					subject: String(outcome.subject),
				}),
				undefined,
				TestId.AddProjectNotAGitRepoModal,
			);
			return true;
	}
}
