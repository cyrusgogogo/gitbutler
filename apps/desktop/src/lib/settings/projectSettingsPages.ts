import { message, type LocalizedText } from "@gitbutler/i18n";
import { type IconName } from "@gitbutler/ui";

interface SettingsPage {
	id: string;
	label: LocalizedText;
	icon: IconName;
	adminOnly?: boolean;
}

export const projectSettingsPages = [
	{
		id: "project",
		label: message("desktop:settings.project"),
		icon: "user",
	},
	{
		id: "git",
		label: message("desktop:settings.git.stuff"),
		icon: "git",
	},
	{
		id: "ai",
		label: message("desktop:settings.ai.options"),
		icon: "ai",
	},
	{
		id: "experimental",
		label: message("desktop:settings.experimental"),
		icon: "lab",
	},
] as const satisfies readonly SettingsPage[];

export type ProjectSettingsPage = (typeof projectSettingsPages)[number];
