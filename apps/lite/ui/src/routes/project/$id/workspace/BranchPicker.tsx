import { useTranslations } from "@gitbutler/i18n/react";
import { headInfoQueryOptions } from "#ui/api/queries.ts";
import { PickerDialog } from "#ui/components/PickerDialog.tsx";
import type { BranchAddress } from "#ui/addresses.ts";
import type { Segment, Stack } from "@gitbutler/but-sdk";
import { useQuery } from "@tanstack/react-query";
import type { FC } from "react";

type BranchPickerOption = {
	id: string;
	label: string;
	branch: BranchAddress;
};

type Props = {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectBranch: (branch: BranchAddress) => void;
};

const segmentToBranchPickerOption = ({
	segment,
}: {
	segment: Segment;
}): BranchPickerOption | null => {
	const refName = segment.refName;
	if (!refName) return null;

	return {
		id: refName.fullNameBytes.join(","),
		label: refName.displayName,
		branch: { branchRef: refName.fullNameBytes },
	};
};

const stackToBranchPickerOptions = (stack: Stack): IteratorObject<BranchPickerOption> =>
	stack.segments
		.values()
		.map((segment) => segmentToBranchPickerOption({ segment }))
		.filter((x) => x != null);

export const BranchPicker: FC<Props> = ({ projectId, open, onOpenChange, onSelectBranch }) => {
	const i18nMessages = useTranslations();
	const { data: headInfo } = useQuery(headInfoQueryOptions(projectId));
	const selectBranch = (option: BranchPickerOption) => {
		onOpenChange(false);
		onSelectBranch(option.branch);
	};

	return (
		<PickerDialog
			ariaLabel={i18nMessages.t("lite:BranchPicker.selectBranch")}
			closeLabel={i18nMessages.t("lite:BranchPicker.closeBranchPicker")}
			emptyLabel={i18nMessages.t("lite:BranchPicker.noResultsFound")}
			getItemKey={(x) => x.id}
			getItemLabel={(x) => x.label}
			getItemType={() => i18nMessages.t("lite:BranchPicker.label1627510b2")}
			itemToStringValue={(x) => x.label}
			items={[
				{
					value: "Branches",
					label: i18nMessages.t("lite:picker.Branches"),
					items: headInfo?.stacks.values().flatMap(stackToBranchPickerOptions).toArray() ?? [],
				},
			]}
			open={open}
			onOpenChange={onOpenChange}
			onSelectItem={selectBranch}
			placeholder={i18nMessages.t("lite:BranchPicker.searchForBranches")}
			selectLabel={i18nMessages.t("lite:BranchPicker.goToBranch")}
		/>
	);
};
