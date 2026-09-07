import type { LocalizedText } from "@gitbutler/i18n";
import { message as i18nMessage } from "@gitbutler/i18n";
import { createElement as createI18nElement } from "react";
import { Message as I18nMessage } from "@gitbutler/i18n/react";
import { Toast } from "@base-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useAddProject } from "#ui/api/mutations.ts";
import { errorMessageForToast } from "#ui/errors.ts";
import { writeLastOpenedProject } from "#ui/project.ts";

type AddProjectOutcome = Awaited<ReturnType<typeof window.lite.addProject>>;
type AddProjectFailure = Exclude<AddProjectOutcome, { type: "added" | "alreadyExists" }>;

const failureMessage = (failure: AddProjectFailure): LocalizedText => {
	switch (failure.type) {
		case "pathNotFound":
			return i18nMessage("lite:addRepository.pathNotFound");
		case "notADirectory":
			return i18nMessage("lite:addRepository.notADirectory");
		case "bareRepository":
			return i18nMessage("lite:addRepository.bareRepository");
		case "nonMainWorktree":
			return i18nMessage("lite:addRepository.nonMainWorktree");
		case "noWorkdir":
			return i18nMessage("lite:addRepository.noWorkdir");
		case "noDotGitDirectory":
			return i18nMessage("lite:addRepository.noDotGitDirectory");
		case "reftableRefFormatUnsupported":
			return i18nMessage("lite:addRepository.reftableRefFormatUnsupported");
		case "notAGitRepository":
			return i18nMessage("lite:addRepository.notAGitRepository");
	}
};

// Must be called from a component that outlives the button: the flow spans a
// native dialog and a mutation, and the picker-dialog footer hosting the
// button unmounts as soon as the dialog closes.
export const useAddLocalRepository = () => {
	const navigate = useNavigate();
	const toastManager = Toast.useToastManager();
	const { isPending, mutateAsync } = useAddProject();

	const addLocalRepository = async () => {
		let path: string | null;
		try {
			path = await window.lite.pickDirectory();
		} catch (error) {
			toastManager.add({
				type: "error",
				title: createI18nElement(I18nMessage, {
					value: i18nMessage("lite:useAddLocalRepository.failedToOpenRepositoryPicker"),
				}),
				description: createI18nElement(I18nMessage, { value: errorMessageForToast(error) }),
			});
			return;
		}

		if (path === null) return;

		let outcome: AddProjectOutcome;
		try {
			outcome = await mutateAsync(path);
		} catch {
			return;
		}

		if (outcome.type === "added" || outcome.type === "alreadyExists") {
			writeLastOpenedProject(outcome.subject.id);
			void navigate({
				to: "/project/$id/workspace",
				params: { id: outcome.subject.id },
			});
			return;
		}

		toastManager.add({
			type: "error",
			title: createI18nElement(I18nMessage, {
				value: i18nMessage("lite:useAddLocalRepository.couldNotAddProject"),
			}),
			description: createI18nElement(I18nMessage, { value: failureMessage(outcome) }),
		});
	};

	return { addLocalRepository, isPending };
};
