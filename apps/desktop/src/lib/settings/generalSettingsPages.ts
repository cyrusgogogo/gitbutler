import { message, type LocalizedText } from "@gitbutler/i18n";
import { type IconName } from "@gitbutler/ui";

interface SettingsPage {
	id: string;
	label: LocalizedText;
	icon: IconName;
	adminOnly?: boolean;
}

export const generalSettingsPages = [
	{
		id: "general",
		label: message("desktop:settings.general"),
		icon: "settings",
	},
	{
		id: "appearance",
		label: message("desktop:settings.appearance"),
		icon: "appearance",
	},
	{
		id: "lanes-and-branches",
		label: message("desktop:settings.lanes.branches"),
		icon: "lanes",
	},
	{
		id: "git",
		label: message("desktop:settings.git.stuff"),
		icon: "git",
	},
	{
		id: "integrations",
		label: message("desktop:settings.integrations"),
		icon: "puzzle",
	},
	{
		id: "ai",
		label: message("desktop:settings.ai.options"),
		icon: "ai",
	},
	{
		id: "telemetry",
		label: message("desktop:settings.telemetry"),
		icon: "chart-bar-x",
	},
	{
		id: "experimental",
		label: message("desktop:settings.experimental"),
		icon: "lab",
	},
	{
		id: "organizations",
		label: message("desktop:settings.organizations"),
		icon: "factory",
		adminOnly: true,
	},
] as const satisfies readonly SettingsPage[];

export type GeneralSettingsPage = (typeof generalSettingsPages)[number];
