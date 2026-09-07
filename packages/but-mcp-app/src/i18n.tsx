import { bindDocumentLanguage, createI18n } from "@gitbutler/i18n";
import { LanguageSelect } from "@gitbutler/i18n/LanguageSelect";
import { browserLanguage } from "@gitbutler/i18n/browser";
import { resources } from "@gitbutler/i18n/catalogs/mcp";
import { useEffect, useSyncExternalStore } from "react";
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";

export const i18n = createI18n(resources);
let hostLocale: string | undefined;
const language = browserLanguage(
	i18n,
	"gitbutler.mcp.language",
	() => hostLocale ?? navigator.language,
);
bindDocumentLanguage(i18n, document);

export function useHostLanguage(app: App | null, isConnected: boolean) {
	useEffect(() => {
		if (!app || !isConnected) return;
		function update(context: Partial<McpUiHostContext>) {
			if ("locale" in context) hostLocale = context.locale;
			language.refresh();
		}
		update(app.getHostContext() ?? {});
		app.addEventListener("hostcontextchanged", update);
		return () => app.removeEventListener("hostcontextchanged", update);
	}, [app, isConnected]);
}

export function McpLanguage() {
	const preference = useSyncExternalStore(language.subscribe, language.getSnapshot);
	return <LanguageSelect value={preference} host onChange={(value) => language.set(value)} />;
}
