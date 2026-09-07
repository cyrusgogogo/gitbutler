import { useTranslations } from "@gitbutler/i18n/react";
import type { MessageKey } from "@gitbutler/i18n";
import { Kbd } from "#ui/components/Kbd.tsx";
import { PickerDialog, type PickerDialogGroup } from "#ui/components/PickerDialog.tsx";
import type { CommandGroup } from "#ui/hotkeys.ts";
import { iteratorConcat } from "#ui/iterator.ts";
import {
	getHotkeyManager,
	getSequenceManager,
	type Hotkey,
	type HotkeyMeta,
	type HotkeyOptions,
	type HotkeySequence,
	type SequenceOptions,
	toHotkeyRegistrationView,
} from "@tanstack/react-hotkeys";
import { useState, type FC } from "react";

type CommandPaletteItem = {
	group: CommandGroup;
	id: string;
	name: string;
	i18nKey?: MessageKey;
	hotkey: Hotkey | HotkeySequence;
	type: "hotkey" | "sequence";
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type CommandPaletteGroup = PickerDialogGroup<CommandPaletteItem> & { value: CommandGroup };
const groupLabels: Record<CommandGroup, MessageKey> = {
	Branch: "lite:commandGroup.branch",
	Commit: "lite:commandGroup.commit",
	Diff: "lite:commandGroup.diff",
	File: "lite:commandGroup.file",
	Global: "lite:commandGroup.global",
	"Operations log": "lite:commandGroup.operationsLog",
	Stack: "lite:commandGroup.stack",
	"Uncommitted changes": "lite:commandGroup.uncommittedChanges",
	Sidebar: "lite:commandGroup.sidebar",
	Workspace: "lite:commandGroup.workspace",
};

const groupCommandPaletteItems = (
	items: Iterable<CommandPaletteItem>,
): Array<CommandPaletteGroup> => {
	const grouped = Map.groupBy(items, (item) => item.group);

	return Array.from(grouped.entries())
		.toSorted(([a], [b]) => a.localeCompare(b))
		.map(
			([group, items]): CommandPaletteGroup => ({
				value: group,
				items: items.toSorted((a, b) => a.name.localeCompare(b.name)),
			}),
		);
};

const isEnabled = <T extends HotkeyOptions | SequenceOptions>(
	opts: T,
	activeElement: Element | null,
): opts is T & { meta: HotkeyMeta & { name: string } } =>
	opts.enabled !== false &&
	opts.meta?.name !== undefined &&
	(!opts.target ||
		opts.target === document ||
		opts.target === window ||
		opts.target === activeElement);

const getCommandPaletteItems = (activeElement: Element | null) => {
	const hotkeyItems: IteratorObject<CommandPaletteItem> = iteratorConcat(
		getHotkeyManager()
			.registrations.state.values()
			.map(toHotkeyRegistrationView)
			.map((hotkey): CommandPaletteItem | null =>
				isEnabled(hotkey.options, activeElement)
					? {
							group: hotkey.options.meta.group,
							id: hotkey.id,
							name: hotkey.options.meta.name,
							i18nKey: hotkey.options.meta.i18nKey,
							hotkey: hotkey.hotkey,
							type: "hotkey",
						}
					: null,
			)
			.filter((x) => x != null),
		getSequenceManager()
			.registrations.state.values()
			.map((sequence): CommandPaletteItem | null =>
				isEnabled(sequence.options, activeElement)
					? {
							group: sequence.options.meta.group,
							id: sequence.id,
							name: sequence.options.meta.name,
							i18nKey: sequence.options.meta.i18nKey,
							hotkey: sequence.sequence,
							type: "sequence",
						}
					: null,
			)
			.filter((x) => x != null),
	);

	return groupCommandPaletteItems(hotkeyItems);
};

export const CommandPalette: FC<Props> = ({ open, onOpenChange }) => {
	const i18nMessages = useTranslations();
	const [items] = useState(() => getCommandPaletteItems(document.activeElement));
	const itemLabel = (item: CommandPaletteItem) =>
		item.i18nKey !== undefined ? i18nMessages.t(item.i18nKey) : item.name;
	const localizedItems = items.map((group) => ({
		...group,
		label: i18nMessages.t(groupLabels[group.value]),
	}));

	const runHotkey = (item: CommandPaletteItem) => {
		onOpenChange(false);
		if (item.type === "hotkey") getHotkeyManager().triggerRegistration(item.id);
		else getSequenceManager().triggerSequence(item.id);
	};

	return (
		<PickerDialog
			ariaLabel={i18nMessages.t("lite:CommandPalette.commandPalette")}
			closeLabel={i18nMessages.t("lite:CommandPalette.closeCommandPalette")}
			emptyLabel={i18nMessages.t("lite:CommandPalette.noHotkeysFound")}
			getItemKey={(x) => x.id}
			getItemLabel={itemLabel}
			getItemType={(x) => <Kbd hotkey={x.hotkey} />}
			itemToStringValue={(x) => `${itemLabel(x)} ${x.name}`}
			items={localizedItems}
			open={open}
			onOpenChange={onOpenChange}
			onSelectItem={runHotkey}
			placeholder={i18nMessages.t("lite:CommandPalette.searchHotkeys")}
			selectLabel={i18nMessages.t("lite:CommandPalette.run")}
		/>
	);
};
