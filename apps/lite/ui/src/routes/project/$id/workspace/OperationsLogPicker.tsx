import { useTranslations } from "@gitbutler/i18n/react";
import { useRestoreSnapshot } from "#ui/api/mutations.ts";
import { operationsLogQueryOptions } from "#ui/api/queries.ts";
import { getButtonClassName } from "#ui/components/Button.tsx";
import { PickerDialog, type PickerDialogGroup } from "#ui/components/PickerDialog.tsx";
import { presentableOperation } from "#ui/snapshot.ts";
import { formatRelativeTime } from "#ui/time.ts";
import type { Snapshot } from "@gitbutler/but-sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type FC, useState } from "react";

type Props = {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const OperationsLogPicker: FC<Props> = ({ open, onOpenChange, projectId }) => {
	const i18nMessages = useTranslations();
	const {
		data: groups,
		fetchNextPage,
		hasNextPage,
		isError,
		isFetchingNextPage,
		isPending,
	} = useInfiniteQuery({
		...operationsLogQueryOptions(projectId),
		select: (data): Array<PickerDialogGroup<Snapshot>> => [
			{
				value: "Operations log",
				label: i18nMessages.t("lite:picker.Operationslog"),
				items: data.pages.flat(),
			},
		],
	});
	const { mutate: restore } = useRestoreSnapshot({ projectId });
	const [now] = useState(() => Date.now());

	const selectSnapshot = (snapshot: Snapshot) => {
		onOpenChange(false);

		restore({ _tag: "restore", snapshot });
	};

	return (
		<PickerDialog
			ariaLabel={i18nMessages.t("lite:OperationsLogPicker.operationsLog")}
			closeLabel={i18nMessages.t("lite:OperationsLogPicker.closeOperationsLog")}
			emptyLabel={i18nMessages.t("lite:OperationsLogPicker.noOperationsFound")}
			footerAction={
				hasNextPage ? (
					<button
						type="button"
						className={getButtonClassName({ size: "small" })}
						disabled={isFetchingNextPage}
						onClick={() => void fetchNextPage()}
					>
						{isFetchingNextPage
							? i18nMessages.t("lite:OperationsLogPicker.label33ce41745")
							: i18nMessages.t("lite:OperationsLogPicker.labeldfe60ca92")}
					</button>
				) : undefined
			}
			getItemKey={(snapshot) => snapshot.commitId}
			getItemLabel={(snapshot) => i18nMessages.text(presentableOperation(snapshot.details).text)}
			getItemType={(snapshot) => formatRelativeTime(snapshot.createdAt, now, i18nMessages.locale)}
			items={groups ?? []}
			open={open}
			onOpenChange={onOpenChange}
			onSelectItem={selectSnapshot}
			placeholder={i18nMessages.t("lite:OperationsLogPicker.searchOperations")}
			selectLabel={i18nMessages.t("lite:OperationsLogPicker.restore")}
			statusLabel={
				isPending
					? i18nMessages.t("lite:OperationsLogPicker.loadingOperationsLog")
					: isError
						? i18nMessages.t("lite:OperationsLogPicker.unableToLoadOperationsLog")
						: undefined
			}
		/>
	);
};
