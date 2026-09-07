import type { LocalizedText } from "@gitbutler/i18n";
import { message as i18nMessage } from "@gitbutler/i18n";
import { useTranslations } from "@gitbutler/i18n/react";
import { getButtonClassName } from "#ui/components/Button.tsx";
import { classes } from "#ui/components/classes.ts";
import { Icon } from "#ui/components/Icon.tsx";
import { TooltipPopup } from "#ui/components/Tooltip.tsx";
import type { IconName } from "#ui/components/iconNames.ts";
import * as md from "#ui/markdown-editing.ts";
import { applyToTextarea } from "#ui/markdown-textarea.ts";
import { Tooltip } from "@base-ui/react";
import type { FC, RefObject } from "react";
import styles from "./MarkdownToolbar.module.css";

type ToolbarButton = {
	icon: IconName;
	label: LocalizedText;
	command: md.MarkdownCommand;
};

/** Groups render separated by a rule, matching the designed toolbar. */
const groups: ReadonlyArray<ReadonlyArray<ToolbarButton>> = [
	[
		{
			icon: "bullet-list",
			label: i18nMessage("lite:MarkdownToolbar.staticdd870cfca"),
			command: md.bulletList,
		},
		{
			icon: "number-list",
			label: i18nMessage("lite:MarkdownToolbar.static8294ea4f7"),
			command: md.numberList,
		},
		{
			icon: "checklist",
			label: i18nMessage("lite:MarkdownToolbar.static91c40abda"),
			command: md.taskList,
		},
	],
	[
		{
			icon: "text-bold",
			label: i18nMessage("lite:MarkdownToolbar.static19e07430e"),
			command: md.bold,
		},
		{
			icon: "text-italic",
			label: i18nMessage("lite:MarkdownToolbar.static1616e2e54"),
			command: md.italic,
		},
		{
			icon: "text-strikethrough",
			label: i18nMessage("lite:MarkdownToolbar.statica93b9a680"),
			command: md.strikethrough,
		},
	],
	[
		{
			icon: "text-code",
			label: i18nMessage("lite:MarkdownToolbar.staticadac69379"),
			command: md.code,
		},
		{
			icon: "text-quote",
			label: i18nMessage("lite:MarkdownToolbar.static309028a9e"),
			command: md.quote,
		},
		{ icon: "link", label: i18nMessage("lite:MarkdownToolbar.staticd0517071a"), command: md.link },
	],
	[
		{
			icon: "text-plain",
			label: i18nMessage("lite:MarkdownToolbar.static9580fcbce"),
			command: md.plainText,
		},
		{
			icon: "text-h2",
			label: i18nMessage("lite:MarkdownToolbar.static6542d3860"),
			command: md.heading2,
		},
		{
			icon: "text-h3",
			label: i18nMessage("lite:MarkdownToolbar.static9694d18f5"),
			command: md.heading3,
		},
	],
];

type Props = {
	/** The textarea whose markdown source the buttons rewrite. */
	targetRef: RefObject<HTMLTextAreaElement | null>;
	/** Receives the rewritten source, for the owner's controlled state. */
	onInput: (value: string) => void;
	disabled?: boolean;
	className?: string;
};

/**
 * Markdown formatting buttons for a plain textarea. The commands themselves
 * live in `markdown-editing.ts`; this only routes them at the live selection.
 */
export const MarkdownToolbar: FC<Props> = (p) => {
	const i18nMessages = useTranslations();
	const apply = (command: md.MarkdownCommand) => {
		const target = p.targetRef.current;
		if (target !== null) p.onInput(applyToTextarea(target, command));
	};

	return (
		<div
			className={classes(p.className, styles.toolbar)}
			role="toolbar"
			aria-label={i18nMessages.t("lite:MarkdownToolbar.formatting")}
		>
			{groups.map((group, index) => (
				// Indices are stable: the groups are a module constant.
				// oxlint-disable-next-line react/no-array-index-key
				<div key={index} className={styles.group}>
					{index > 0 && <div aria-hidden className={styles.separator} />}
					{group.map((button) => (
						<Tooltip.Root key={button.icon}>
							<Tooltip.Trigger
								className={getButtonClassName({ variant: "ghost", iconOnly: true })}
								// base-ui's own `disabled` only suppresses the tooltip, leaving a
								// live button behind, so the native attributes go on the element.
								render={
									<button
										aria-label={i18nMessages.text(button.label)}
										disabled={p.disabled}
										type="button"
									/>
								}
								// Keeps the caret in the textarea: a plain click would blur it
								// first, so the command would have no selection to act on.
								onMouseDown={(evt) => evt.preventDefault()}
								onClick={() => apply(button.command)}
							>
								<Icon name={button.icon} />
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Positioner sideOffset={4}>
									<Tooltip.Popup render={<TooltipPopup />}>
										{i18nMessages.text(button.label)}
									</Tooltip.Popup>
								</Tooltip.Positioner>
							</Tooltip.Portal>
						</Tooltip.Root>
					))}
				</div>
			))}
		</div>
	);
};
