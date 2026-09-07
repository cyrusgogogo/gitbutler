import { message as i18nMessage } from "@gitbutler/i18n";
import { useOpenInProgram } from "#ui/api/mutations.ts";
import {
	guiSettingsQueryOptions,
	listEditorsQueryOptions,
	listProjectsQueryOptions,
} from "#ui/api/queries.ts";
import { changesFileHotkeys, toElectronAccelerator } from "#ui/hotkeys.ts";
import { type NativeMenuItem, nativeMenuItem } from "#ui/native-menu.ts";
import { useRevealInFolder } from "./useRevealInFolder.ts";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

/**
 * What a file offers wherever it is listed: open it, reveal it, copy its
 * path. None of these ask what the file belongs to, so surfaces with no notion of a
 * parent — edit mode, where every file belongs to the commit being edited —
 * can offer them too. Resolving the editor and the project's location still
 * takes queries, which every row calling this subscribes to.
 */
export const usePathMenuItems = ({
	projectId,
	path,
}: {
	projectId: string;
	path: string;
}): Array<NativeMenuItem> => {
	const { data: projects } = useSuspenseQuery(listProjectsQueryOptions);
	const { data: editors } = useQuery(listEditorsQueryOptions);
	const { data: preferredEditor } = useQuery({
		...guiSettingsQueryOptions,
		select: (cfg) => editors?.find((editor) => editor.id === cfg.editorId),
	});

	const selectedProject = projects.find((project) => project.id === projectId);
	if (!selectedProject) throw new Error("Could not find selected project");

	const { isPending: isOpenInProgramPending, mutate: openInProgram } = useOpenInProgram();
	const revealInFolder = useRevealInFolder(projectId);

	return [
		preferredEditor
			? nativeMenuItem({
					label: i18nMessage("lite:usePathMenuItems.openInValue", { value: preferredEditor.name }),
					enabled: !isOpenInProgramPending,
					accelerator: toElectronAccelerator(changesFileHotkeys.openInEditor.hotkey),
					onSelect: () =>
						openInProgram({
							projectId,
							programId: preferredEditor.id,
							path,
							lineNr: null,
						}),
				})
			: nativeMenuItem({
					label: i18nMessage("lite:usePathMenuItems.openInEditor"),
					submenu:
						editors?.map((editor) =>
							nativeMenuItem({
								label: editor.name,
								enabled: !isOpenInProgramPending,
								onSelect: () =>
									openInProgram({
										projectId,
										programId: editor.id,
										path,
										lineNr: null,
									}),
							}),
						) ?? [],
				}),
		nativeMenuItem({
			label: i18nMessage(changesFileHotkeys.revealInFolder.meta.i18nKey),
			accelerator: toElectronAccelerator(changesFileHotkeys.revealInFolder.hotkey),
			onSelect: () => revealInFolder(path),
		}),
		nativeMenuItem({
			label: i18nMessage("lite:usePathMenuItems.copyPath"),
			submenu: [
				nativeMenuItem({
					label: i18nMessage("lite:usePathMenuItems.absolutePath"),
					onSelect: async () => {
						const absolutePath = await window.lite.pathJoin(selectedProject.path, path);
						await window.lite.clipboardWriteText(absolutePath);
					},
				}),
				nativeMenuItem({
					label: i18nMessage("lite:usePathMenuItems.relativePath"),
					onSelect: () => window.lite.clipboardWriteText(path),
				}),
			],
		}),
	];
};
