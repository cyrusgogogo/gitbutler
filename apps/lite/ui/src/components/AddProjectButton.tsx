import { Message as I18nMessage } from "@gitbutler/i18n/react";
import type { FC } from "react";
import { getButtonClassName } from "#ui/components/Button.tsx";

type Props = {
	isPending: boolean;
	onClick: () => void;
};

export const AddProjectButton: FC<Props> = ({ isPending, onClick }) => (
	<button type="button" className={getButtonClassName({})} disabled={isPending} onClick={onClick}>
		{isPending ? (
			<I18nMessage value={{ key: "lite:AddProjectButton.addingRepository" }} />
		) : (
			<I18nMessage value={{ key: "lite:AddProjectButton.addLocalRepository" }} />
		)}
	</button>
);
