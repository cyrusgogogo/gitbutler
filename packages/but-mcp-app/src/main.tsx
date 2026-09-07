import { WorkspaceApp } from "./WorkspaceApp.tsx";
import { i18n, McpLanguage } from "./i18n";
import { I18nProvider } from "@gitbutler/i18n/react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const root = document.getElementById("root");

if (root === null) {
	throw new Error("GitButler MCP App root element is missing");
}

function updateTitle() {
	document.title = i18n.t("mcp:document.workspace");
}
updateTitle();
i18n.subscribe(updateTitle);

createRoot(root).render(
	<I18nProvider i18n={i18n}>
		<div className="language-bar">
			<McpLanguage />
		</div>
		<WorkspaceApp />
	</I18nProvider>,
);
