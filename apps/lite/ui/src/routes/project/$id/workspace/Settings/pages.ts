import type { LocalizedText } from "@gitbutler/i18n";
import { message as i18nMessage } from "@gitbutler/i18n";
import type { IconName } from "#ui/components/iconNames.ts";

/** What a page configures: the application, or the project it was opened over. */
type SettingsScope = "global" | "project";

type SettingsPage = {
	/**
	 * Scope-prefixed, which is what keeps a page name that exists in both scopes — `git`
	 * will — from colliding. The prefix is the identity, so there is no separate scope
	 * field to fall out of step with it.
	 */
	key: `${SettingsScope}:${string}`;
	label: LocalizedText;
	icon: IconName;
};

/**
 * Every settings page, in sidebar order, both scopes in one list.
 *
 * Desktop needs two dialogs for this because its global settings are reachable without a
 * project. Lite's are not — the dialog only mounts inside the workspace route — so one
 * list carries both, and a project page is a page like any other.
 */
export const settingsPages = [
	{ key: "global:general", label: i18nMessage("lite:pages.static9239ee2cd"), icon: "settings" },
	{ key: "global:appearance", label: i18nMessage("lite:pages.static41def7a0f"), icon: "mixer" },
	{ key: "global:ai", label: "AI", icon: "ai" },
	{ key: "global:git", label: "Git", icon: "branch" },
	{ key: "global:integrations", label: i18nMessage("lite:pages.statica7881cac6"), icon: "globe" },
	{ key: "global:experimental", label: i18nMessage("lite:pages.staticb718f8c3a"), icon: "danger" },
	{ key: "project:project", label: i18nMessage("lite:pages.staticf6f4da8d9"), icon: "workbench" },
	{ key: "project:ai", label: "AI", icon: "ai" },
	{ key: "project:git", label: "Git", icon: "branch" },
	{ key: "project:experimental", label: i18nMessage("lite:pages.staticb718f8c3a"), icon: "danger" },
] as const satisfies ReadonlyArray<SettingsPage>;

/** Sidebar group order. */
export const settingsScopes = ["global", "project"] as const satisfies ReadonlyArray<SettingsScope>;

export type SettingsPageKey = (typeof settingsPages)[number]["key"];

/** Sits under the pages, the way desktop ends its settings nav. */
export const externalLinks = [
	{
		label: i18nMessage("lite:pages.static68a419422"),
		icon: "docs",
		url: "https://docs.gitbutler.com/",
	},
	{
		label: i18nMessage("lite:pages.statica31feef28"),
		icon: "discord",
		url: "https://discord.gg/MmFkmaJ42D",
	},
] as const satisfies ReadonlyArray<{ label: LocalizedText; icon: IconName; url: string }>;

export const settingsPagesInScope = (scope: SettingsScope) =>
	settingsPages.filter((page) => page.key.startsWith(`${scope}:`));

export const defaultSettingsPageKey = "global:general" satisfies SettingsPageKey;
