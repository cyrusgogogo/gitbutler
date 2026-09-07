(() => {
	const catalogs = Object.fromEntries(["en", "zh-CN"].map((locale) => [locale, {
		...JSON.parse(document.getElementById(`common-${locale}`).textContent),
		...JSON.parse(document.getElementById(`mcp-${locale}`).textContent),
	}]));
	const storageKey = "gitbutler.mcp.language";
	const selector = document.getElementById("language");
	const notice = document.getElementById("notice");
	const normalize = (value) => value === "en" || value === "zh-CN" ? value : "system";
	let preference = "system";
	let hostLocale;
	let sessionOnly = false;
	try { preference = normalize(localStorage.getItem(storageKey)); } catch { /* Session preference remains usable. */ }

	function locale() {
		if (preference !== "system") return preference;
		try {
			const resolved = new Intl.Locale((hostLocale ?? navigator.language).replaceAll("_", "-")).maximize();
			return resolved.language === "zh" && resolved.script === "Hans" ? "zh-CN" : "en";
		} catch { return "en"; }
	}

	function render() {
		const active = locale();
		const messages = catalogs[active];
		document.documentElement.lang = active;
		document.title = messages["fallback.title"];
		document.getElementById("title").textContent = messages["fallback.title"];
		document.getElementById("message").textContent = messages["fallback.message"];
		document.getElementById("language-label").textContent = messages["language.label"];
		selector.options[0].textContent = messages["language.host"];
		selector.value = preference;
		notice.hidden = !sessionOnly;
		notice.textContent = sessionOnly ? messages["language.sessionOnly"] : "";
	}

	selector.addEventListener("change", () => {
		preference = normalize(selector.value);
		try { localStorage.setItem(storageKey, preference); sessionOnly = false; }
		catch { sessionOnly = true; }
		render();
	});
	window.addEventListener("languagechange", render);
	window.addEventListener("storage", (event) => {
		if (event.key !== null && event.key !== storageKey) return;
		preference = normalize(event.newValue);
		render();
	});
	// Only the embedding host can provide locale updates. No tools or repository data are requested.
	window.addEventListener("message", (event) => {
		if (event.source !== window.parent || event.data?.jsonrpc !== "2.0") return;
		const data = event.data;
		const context = data.id === "gitbutler-fallback-initialize"
			? data.result?.hostContext
			: data.method === "ui/notifications/host-context-changed" ? data.params : undefined;
		if (context && "locale" in context) {
			hostLocale = typeof context.locale === "string" ? context.locale : undefined;
			render();
		}
		if (data.id === "gitbutler-fallback-initialize" && data.result) {
			window.parent.postMessage({ jsonrpc: "2.0", method: "ui/notifications/initialized" }, "*");
		}
	});
	render();
	if (window.parent !== window) window.parent.postMessage({
		jsonrpc: "2.0",
		id: "gitbutler-fallback-initialize",
		method: "ui/initialize",
		params: {
			appInfo: { name: "GitButler MCP fallback", version: "1.0.0" },
			appCapabilities: {},
			protocolVersion: "2026-01-26",
		},
	}, "*");
})();
