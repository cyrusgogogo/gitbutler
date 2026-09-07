import { message as i18nMessage } from "@gitbutler/i18n";
import { nativeMenuItem } from "#ui/native-menu.ts";
import { sidebarHotkeys, toElectronAccelerator } from "#ui/hotkeys.ts";

export const insertBlankCommitMenuItem = (
	insertBlankCommit: (side: "above" | "below") => void,
	acceleratorSide: "above" | "below",
) =>
	nativeMenuItem({
		label: i18nMessage("lite:insertBlankCommitMenuItem.addEmptyCommit"),
		submenu: [
			nativeMenuItem({
				label: i18nMessage("lite:insertBlankCommitMenuItem.above"),
				accelerator:
					acceleratorSide === "above"
						? toElectronAccelerator(sidebarHotkeys.insertEmptyCommitAbove.hotkey)
						: undefined,
				onSelect: () => insertBlankCommit("above"),
			}),
			nativeMenuItem({
				label: i18nMessage("lite:insertBlankCommitMenuItem.below"),
				accelerator: toElectronAccelerator(
					acceleratorSide === "below"
						? sidebarHotkeys.insertEmptyCommitAbove.hotkey
						: sidebarHotkeys.insertEmptyCommitBelow.hotkey,
				),
				onSelect: () => insertBlankCommit("below"),
			}),
		],
	});
