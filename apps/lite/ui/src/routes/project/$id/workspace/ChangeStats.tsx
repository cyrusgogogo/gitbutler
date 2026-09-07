import { useTranslations } from "@gitbutler/i18n/react";
import { Badge } from "#ui/components/Badge.tsx";
import { classes } from "#ui/components/classes.ts";
import { DiffStats } from "#ui/components/DiffStats.tsx";
import { TooltipPopup } from "#ui/components/Tooltip.tsx";
import { Tooltip } from "@base-ui/react";
import type { FC } from "react";
import styles from "./ChangeStats.module.css";
import { describeLineStats, type LineStats } from "./lineStats.ts";

/**
 * File count and added/removed line totals for a set of changes.
 *
 * Shown in the files panel header, and in the diff toolbar when that panel is hidden.
 */
export const ChangeStats: FC<{
	fileCount: number;
	lineStats: LineStats;
	className?: string;
}> = ({ fileCount, lineStats, className }) => {
	const i18nMessages = useTranslations();
	// The file count is the only genuinely ambiguous number — a green +N next to a red -N reads
	// as added/removed lines on sight — so the tooltip only explains that one. Screen readers
	// get the full wording instead, since the colours carry no meaning for them.
	const description = i18nMessages.t("lite:files.changed", { count: fileCount });
	const spoken = [description, ...describeLineStats(lineStats).map(i18nMessages.text)];

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span aria-label={spoken.join(", ")} className={classes(styles.container, className)}>
						<Badge variant="lightGray">{fileCount}</Badge>

						<DiffStats
							added={lineStats.linesAdded}
							removed={lineStats.linesRemoved}
							className="text-12"
						/>
					</span>
				}
			/>
			<Tooltip.Portal>
				<Tooltip.Positioner sideOffset={4}>
					<Tooltip.Popup render={<TooltipPopup />}>{description}</Tooltip.Popup>
				</Tooltip.Positioner>
			</Tooltip.Portal>
		</Tooltip.Root>
	);
};
