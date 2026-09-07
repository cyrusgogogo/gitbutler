import type { MessageKey } from "@gitbutler/i18n";
import {
	formatForDisplay,
	normalizeRegisterableHotkey,
	type Hotkey,
	type HotkeyMeta,
	type RegisterableHotkey,
} from "@tanstack/react-hotkeys";

const modifierOrder = ["⌃", "⌥", "⇧", "⌘"];

const sortModifiers = (keys: Array<string>): Array<string> => [
	...keys
		.filter((key) => modifierOrder.includes(key))
		.toSorted((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b)),
	...keys.filter((key) => !modifierOrder.includes(key)),
];

// This wrapper ensures the format matches Apple's HIG and thereby also what
// we show in context menus.
// https://github.com/TanStack/hotkeys/issues/136
export const formatForDisplaySorted = (hotkey: Parameters<typeof formatForDisplay>[0]): string =>
	sortModifiers(formatForDisplay(hotkey).split(" ")).join(" ");

export type CommandGroup =
	| "Branch"
	| "Commit"
	| "Diff"
	| "File"
	| "Global"
	| "Operations log"
	| "Stack"
	| "Uncommitted changes"
	| "Sidebar"
	| "Workspace";

declare module "@tanstack/react-hotkeys" {
	interface HotkeyMeta {
		group: CommandGroup;
		i18nKey?: MessageKey;
	}
}

type HotkeySegment<T extends string> = T extends `${infer Head}+${infer Tail}`
	? Head | HotkeySegment<Tail>
	: T;

const electronAcceleratorKeys: Partial<Record<HotkeySegment<Hotkey>, string>> = {
	Alt: "Alt",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	ArrowUp: "Up",
	Backspace: "Backspace",
	Control: "Control",
	Delete: "Delete",
	End: "End",
	Escape: "Esc",
	Enter: "Enter",
	Home: "Home",
	Meta: "Command",
	Mod: "CommandOrControl",
	PageDown: "PageDown",
	PageUp: "PageUp",
	Shift: "Shift",
	Space: "Space",
	Tab: "Tab",
};

export const toElectronAccelerator = (hotkey: RegisterableHotkey): string | undefined => {
	const accelerator = normalizeRegisterableHotkey(hotkey)
		.split("+")
		.map((part) => electronAcceleratorKeys[part as HotkeySegment<Hotkey>] ?? part)
		.join("+");

	return accelerator.length > 0 ? accelerator : undefined;
};

type HotkeyWithMeta = {
	hotkey: RegisterableHotkey;
	meta?: HotkeyMeta;
};

export const globalHotkeys = {
	commandPalette: {
		hotkey: "Mod+K",
	},
	operationsLog: {
		hotkey: "Mod+Shift+O",
		meta: {
			group: "Operations log",
			name: "Show operations log",
			i18nKey: "lite:hotkeys.showOperationsLog",
		},
	},
	redo: {
		hotkey: "Mod+Shift+Z",
		meta: { group: "Operations log", name: "Redo", i18nKey: "lite:hotkeys.redo" },
	},
	selectProject: {
		hotkey: "Mod+Shift+P",
		meta: { group: "Global", name: "Select project", i18nKey: "lite:hotkeys.selectProject" },
	},
	undo: {
		hotkey: "Mod+Z",
		meta: { group: "Operations log", name: "Undo", i18nKey: "lite:hotkeys.undo" },
	},
} satisfies Record<string, HotkeyWithMeta>;

export const workspaceHotkeys = {
	applyBranch: {
		hotkey: "Mod+Shift+A",
		meta: { group: "Workspace", name: "Apply branch", i18nKey: "lite:hotkeys.applyBranch" },
	},
	createIndependentBranch: {
		hotkey: "Mod+N",
		meta: { group: "Workspace", name: "Add new branch", i18nKey: "lite:hotkeys.addNewBranch" },
	},
	/**
	 * The shifted counterpart of `createIndependentBranch`: the same act, but
	 * leaving the workspace for the new branch rather than adding it alongside.
	 */
	createBranchAndSwitch: {
		hotkey: "Mod+Shift+N",
		meta: {
			group: "Workspace",
			name: "Add new branch and switch to it",
			i18nKey: "lite:hotkeys.addNewBranchAndSwitchToIt",
		},
	},
	fetchFromRemotes: {
		hotkey: "Alt+Shift+F",
		meta: { group: "Workspace", name: "Fetch", i18nKey: "lite:hotkeys.fetch" },
	},
	updateWorkspace: {
		hotkey: "Alt+Shift+R",
		meta: {
			group: "Workspace",
			name: "Update workspace (rebases all stacks)",
			i18nKey: "lite:hotkeys.updateWorkspaceRebasesAllStacks",
		},
	},
	focusHorizontalScopeLeft: {
		hotkey: "ArrowLeft",
	},
	focusHorizontalScopeRight: {
		hotkey: "ArrowRight",
	},
	openInTerminal: {
		hotkey: "Mod+Shift+T",
		meta: {
			group: "Workspace",
			name: "Open project in terminal",
			i18nKey: "lite:hotkeys.openProjectInTerminal",
		},
	},
	settings: {
		hotkey: "Mod+,",
		meta: { group: "Workspace", name: "Settings", i18nKey: "lite:hotkeys.settings" },
	},
	toggleFiles: {
		hotkey: "F",
		meta: { group: "Diff", name: "Toggle files", i18nKey: "lite:hotkeys.toggleFiles" },
	},
	toggleSidebar: {
		hotkey: ".",
		meta: { group: "Global", name: "Toggle sidebar", i18nKey: "lite:hotkeys.toggleSidebar" },
	},
} satisfies Record<string, HotkeyWithMeta>;

export const branchesHotkeys = {
	copy: {
		hotkey: "Mod+C",
		meta: { group: "Sidebar", name: "Copy", i18nKey: "lite:hotkeys.copy" },
	},
	deleteBranchRef: {
		hotkey: globalThis.window.lite.platform === "darwin" ? "Mod+Backspace" : "Delete",
		meta: {
			group: "Branch",
			name: "Delete branch reference",
			i18nKey: "lite:hotkeys.deleteBranchReference",
		},
	},
} satisfies Record<string, HotkeyWithMeta>;

export const sidebarHotkeys = {
	copy: {
		hotkey: "Mod+C",
		meta: { group: "Sidebar", name: "Copy", i18nKey: "lite:hotkeys.copy" },
	},
	checkCommit: {
		hotkey: "Space",
		meta: { group: "Commit", name: "Check commit", i18nKey: "lite:hotkeys.checkCommit" },
	},
	checkBranchCommits: {
		hotkey: "Space",
		meta: {
			group: "Branch",
			name: "Check branch commits",
			i18nKey: "lite:hotkeys.checkBranchCommits",
		},
	},
	insertEmptyCommitAbove: {
		hotkey: "N",
		meta: {
			group: "Commit",
			name: "Insert empty commit above",
			i18nKey: "lite:hotkeys.insertEmptyCommitAbove",
		},
	},
	insertEmptyCommitBelow: {
		hotkey: "Shift+N",
		meta: {
			group: "Commit",
			name: "Insert empty commit below",
			i18nKey: "lite:hotkeys.insertEmptyCommitBelow",
		},
	},
	createDependentBranchAbove: {
		hotkey: "B",
		meta: {
			group: "Branch",
			name: "Create dependent branch above",
			i18nKey: "lite:hotkeys.createDependentBranchAbove",
		},
	},
	openCommitInBrowser: {
		hotkey: "O",
		meta: {
			group: "Commit",
			name: "Open commit in browser",
			i18nKey: "lite:hotkeys.openCommitInBrowser",
		},
	},
	openPRInBrowser: {
		hotkey: "O",
		meta: {
			group: "Branch",
			name: "Open pull request in browser",
			i18nKey: "lite:hotkeys.openPullRequestInBrowser",
		},
	},
	composeCommitMessage: {
		hotkey: "Shift+Z",
	},
	deleteBranchRef: {
		hotkey: "Mod+Alt+Backspace",
		meta: {
			group: "Branch",
			name: "Delete branch reference",
			i18nKey: "lite:hotkeys.deleteBranchReference",
		},
	},
	deleteCommit: {
		hotkey: globalThis.window.lite.platform === "darwin" ? "Mod+Backspace" : "Delete",
		meta: { group: "Commit", name: "Delete commit", i18nKey: "lite:hotkeys.deleteCommit" },
	},
	moveCommitDown: {
		hotkey: "Alt+ArrowDown",
		meta: { group: "Commit", name: "Move commit down", i18nKey: "lite:hotkeys.moveCommitDown" },
	},
	moveCommitUp: {
		hotkey: "Alt+ArrowUp",
		meta: { group: "Commit", name: "Move commit up", i18nKey: "lite:hotkeys.moveCommitUp" },
	},
	workspaceBranchAndAncestorsPush: {
		hotkey: "Shift+P",
		meta: {
			group: "Branch",
			name: "Push with branches below",
			i18nKey: "lite:hotkeys.pushWithBranchesBelow",
		},
	},
	updateStack: {
		hotkey: "Alt+R",
		meta: {
			group: "Stack",
			name: "Update stack (rebases)",
			i18nKey: "lite:hotkeys.updateStackRebases",
		},
	},
	renameBranch: {
		hotkey: "R",
		meta: { group: "Branch", name: "Rename branch", i18nKey: "lite:hotkeys.renameBranch" },
	},
	rewordCommit: {
		hotkey: "R",
		meta: { group: "Commit", name: "Reword commit", i18nKey: "lite:hotkeys.rewordCommit" },
	},
	selectBranch: {
		hotkey: "T",
		meta: { group: "Workspace", name: "Jump to branch", i18nKey: "lite:hotkeys.jumpToBranch" },
	},
	toggleFoldBranch: {
		hotkey: "Z",
		meta: {
			group: "Branch",
			name: "Fold/unfold commits",
			i18nKey: "lite:hotkeys.foldUnfoldCommits",
		},
	},
	uncommitCommit: {
		hotkey: "Mod+Alt+Backspace",
		meta: { group: "Commit", name: "Uncommit", i18nKey: "lite:hotkeys.uncommit" },
	},
} satisfies Record<string, HotkeyWithMeta>;

export const changesHotkeys = {
	amendCommit: {
		hotkey: "Mod+Alt+Enter",
		meta: { group: "Uncommitted changes", name: "Amend", i18nKey: "lite:hotkeys.amend" },
	},
	commit: {
		hotkey: "Mod+Enter",
		meta: { group: "Uncommitted changes", name: "Commit", i18nKey: "lite:hotkeys.commit" },
	},
	selectCommitTarget: {
		hotkey: "Mod+Shift+B",
	},
} satisfies Record<string, HotkeyWithMeta>;

/** What the platform calls revealing a file in its file manager. */
const revealInFolderLabel =
	globalThis.window.lite.platform === "darwin"
		? "Reveal in Finder"
		: globalThis.window.lite.platform === "win32"
			? "Show in File Explorer"
			: "Show in File Manager";

const revealInFolderKey =
	globalThis.window.lite.platform === "darwin"
		? "lite:reveal.finder"
		: globalThis.window.lite.platform === "win32"
			? "lite:reveal.explorer"
			: "lite:reveal.fileManager";

export const changesFileHotkeys = {
	absorb: {
		hotkey: "A",
		meta: { group: "File", name: "Absorb", i18nKey: "lite:hotkeys.absorb" },
	},
	checkFile: {
		hotkey: "Space",
		meta: { group: "File", name: "Check file", i18nKey: "lite:hotkeys.checkFile" },
	},
	discard: {
		hotkey: "Mod+Backspace",
		meta: { group: "File", name: "Discard changes", i18nKey: "lite:hotkeys.discardChanges" },
	},
	filter: {
		hotkey: "Mod+F",
		meta: { group: "File", name: "Filter files", i18nKey: "lite:hotkeys.filterFiles" },
	},
	openInEditor: {
		hotkey: "E",
		meta: { group: "File", name: "Open in editor", i18nKey: "lite:hotkeys.openInEditor" },
	},
	revealInFolder: {
		hotkey: "Shift+E",
		meta: { group: "File", name: revealInFolderLabel, i18nKey: revealInFolderKey },
	},
	toggleFoldDirectory: {
		hotkey: "Z",
		meta: {
			group: "File",
			name: "Fold/unfold directory",
			i18nKey: "lite:hotkeys.foldUnfoldDirectory",
		},
	},
	uncommit: {
		hotkey: "Mod+Alt+Backspace",
		meta: { group: "File", name: "Uncommit", i18nKey: "lite:hotkeys.uncommit" },
	},
} satisfies Record<string, HotkeyWithMeta>;

export const pullRequestHotkeys = {
	update: {
		hotkey: "Mod+Enter",
	},
	/* Same chord as `update`, but bound on the comment composer rather than the
	   description form, so only the focused one fires. */
	comment: {
		hotkey: "Mod+Enter",
	},
} satisfies Record<string, HotkeyWithMeta>;

export const selectionOperationHotkeys = {
	move: {
		hotkey: "M",
	},
	cut: {
		hotkey: "Mod+X",
	},
} satisfies Record<string, HotkeyWithMeta>;

export const operationHotkeys = {
	cancel: {
		hotkey: "Escape",
	},
	confirm: {
		hotkey: "Enter",
	},
	confirmTransfer: {
		hotkey: "Mod+V",
	},
	selectCopy: {
		hotkey: "C",
	},
	selectMove: {
		hotkey: "M",
	},
	selectAbove: {
		hotkey: "A",
	},
	selectBelow: {
		hotkey: "B",
	},
	selectInto: {
		hotkey: "I",
	},
} satisfies Record<string, HotkeyWithMeta>;

export const diffHotkeys = {
	absorb: {
		hotkey: "A",
		meta: { group: "Diff", name: "Absorb hunk", i18nKey: "lite:hotkeys.absorbHunk" },
	},
	addComment: {
		hotkey: "C",
		meta: { group: "Diff", name: "Add comment", i18nKey: "lite:hotkeys.addComment" },
	},
	checkHunk: {
		hotkey: "Space",
		meta: {
			group: "Diff",
			name: "Check selected lines",
			i18nKey: "lite:hotkeys.checkSelectedLines",
		},
	},
	previousFile: {
		hotkey: "Alt+Shift+ArrowUp",
		meta: { group: "Diff", name: "Previous file", i18nKey: "lite:hotkeys.previousFile" },
	},
	nextFile: {
		hotkey: "Alt+Shift+ArrowDown",
		meta: { group: "Diff", name: "Next file", i18nKey: "lite:hotkeys.nextFile" },
	},
	toggleFoldFile: {
		hotkey: "Z",
		meta: { group: "Diff", name: "Fold/unfold file", i18nKey: "lite:hotkeys.foldUnfoldFile" },
	},
	toggleReviewedFile: {
		hotkey: "R",
	},
	toggleDiffStyle: {
		hotkey: "Mod+B",
		meta: { group: "Diff", name: "Toggle diff style", i18nKey: "lite:hotkeys.toggleDiffStyle" },
	},
	openInEditor: {
		hotkey: "E",
		meta: { group: "Diff", name: "Open in editor", i18nKey: "lite:hotkeys.openInEditor" },
	},
	revealInFolder: {
		hotkey: "Shift+E",
		meta: { group: "Diff", name: revealInFolderLabel, i18nKey: revealInFolderKey },
	},
	search: {
		hotkey: "Mod+F",
		meta: { group: "Diff", name: "Search diff", i18nKey: "lite:hotkeys.searchDiff" },
	},
} satisfies Record<string, HotkeyWithMeta>;
