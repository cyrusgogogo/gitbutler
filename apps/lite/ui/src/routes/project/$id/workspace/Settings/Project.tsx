import { Message as I18nMessage, useTranslations } from "@gitbutler/i18n/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FC } from "react";
import { listProjectsQueryOptions } from "#ui/api/queries.ts";
import { useDeleteProject, useUpdateProjectSettings } from "#ui/api/mutations.ts";
import { getButtonClassName } from "#ui/components/Button.tsx";
import { assert } from "#ui/assert.ts";
import styles from "./Project.module.css";
import { changing } from "./project-settings.ts";
import { Row, Section } from "./Section.tsx";

export const Project: FC<{ projectId: string }> = ({ projectId }) => {
	const i18nMessages = useTranslations();
	const { data: projects } = useSuspenseQuery(listProjectsQueryOptions);
	const project = assert(projects.find((candidate) => candidate.id === projectId));
	const { mutate: updateProjectSettings } = useUpdateProjectSettings(projectId);
	const { isPending: isRemoving, mutate: deleteProject } = useDeleteProject(projectId);
	const navigate = useNavigate();

	// Held locally so a refetch cannot interrupt typing; committed on blur or Enter.
	const [title, setTitle] = useState(project.title);
	const [description, setDescription] = useState(project.description ?? "");
	const [confirmingRemove, setConfirmingRemove] = useState(false);

	const removeProject = () =>
		deleteProject(projectId, {
			// The route this dialog lives in is gone, so leave before it notices.
			onSuccess: () => void navigate({ to: "/" }),
		});

	const saveTitle = () => {
		// The picker and window title both read this, so an empty one is not useful.
		if (title.trim() === "") setTitle(project.title);
		else updateProjectSettings({ projectId, settings: changing({ title }) });
	};

	return (
		<Section>
			<Row label={i18nMessages.t("lite:Project.name")} htmlFor="project-title">
				<input
					id="project-title"
					type="text"
					value={title}
					onChange={(evt) => setTitle(evt.currentTarget.value)}
					onBlur={saveTitle}
					onKeyDown={(evt) => evt.key === "Enter" && saveTitle()}
				/>
			</Row>

			<Row label={i18nMessages.t("lite:Project.description")} htmlFor="project-description">
				<input
					id="project-description"
					type="text"
					value={description}
					onChange={(evt) => setDescription(evt.currentTarget.value)}
					onBlur={() => updateProjectSettings({ projectId, settings: changing({ description }) })}
					onKeyDown={(evt) =>
						evt.key === "Enter" &&
						updateProjectSettings({ projectId, settings: changing({ description }) })
					}
				/>
			</Row>

			<Row
				label={i18nMessages.t("lite:Project.path")}
				hint={i18nMessages.t("lite:Project.whereTheRepositoryLivesSetWhenTheProject")}
			>
				<span className={styles.path} title={project.path}>
					{project.path}
				</span>
			</Row>

			<Row
				label={i18nMessages.t("lite:Project.removeProject")}
				hint={i18nMessages.t("lite:Project.forgetsItsGitButlerConfigurationTheRepositoryOnDisk")}
			>
				{confirmingRemove ? (
					<div className={styles.confirm}>
						<button
							type="button"
							className={getButtonClassName({ variant: "danger", size: "small" })}
							disabled={isRemoving}
							onClick={removeProject}
						>
							{isRemoving ? (
								<I18nMessage value={{ key: "lite:Project.removing" }} />
							) : (
								<I18nMessage value={{ key: "lite:Project.confirm" }} />
							)}
						</button>
						<button
							type="button"
							className={getButtonClassName({ size: "small" })}
							disabled={isRemoving}
							onClick={() => setConfirmingRemove(false)}
						>
							<I18nMessage value={{ key: "lite:Project.cancel" }} />
						</button>
					</div>
				) : (
					<button
						type="button"
						className={getButtonClassName({ variant: "danger", size: "small" })}
						onClick={() => setConfirmingRemove(true)}
					>
						<I18nMessage value={{ key: "lite:Project.remove" }} />
					</button>
				)}
			</Row>
		</Section>
	);
};
