import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../../../", import.meta.url);
const source = fs.readFileSync(new URL("crates/but/src/command/mcp/fallback.js", root), "utf8");
function mount({ stored = null, denied = false, browser = "en-US" } = {}) {
	const listeners = new Map();
	const nodes = new Map();
	for (const locale of ["en", "zh-CN"])
		for (const namespace of ["common", "mcp"]) {
			nodes.set(`${namespace}-${locale}`, {
				textContent: fs.readFileSync(
					new URL(`packages/i18n/src/locales/${locale}/${namespace}.json`, root),
					"utf8",
				),
			});
		}
	for (const id of ["title", "message", "language-label", "notice"])
		nodes.set(id, { textContent: "", hidden: false });
	const selector = {
		value: "",
		options: [{}, {}, {}],
		addEventListener: (name, handler) => listeners.set(`select:${name}`, handler),
	};
	nodes.set("language", selector);
	const sent = [];
	const parent = { postMessage: (message) => sent.push(message) };
	const window = { parent, addEventListener: (name, handler) => listeners.set(name, handler) };
	const document = {
		documentElement: { lang: "" },
		title: "",
		getElementById: (id) => nodes.get(id),
	};
	const localStorage = {
		getItem: () => {
			if (denied) throw new Error("denied");
			return stored;
		},
		setItem: (_key, value) => {
			if (denied) throw new Error("denied");
			stored = value;
		},
	};
	vm.runInNewContext(source, {
		document,
		window,
		navigator: { language: browser },
		localStorage,
		Intl,
	});
	return {
		document,
		nodes,
		selector,
		sent,
		choose(value) {
			selector.value = value;
			listeners.get("select:change")();
		},
		host(locale, fromHost = true) {
			listeners.get("message")({
				source: fromHost ? parent : {},
				data: {
					jsonrpc: "2.0",
					method: "ui/notifications/host-context-changed",
					params: { locale },
				},
			});
		},
		initialize(locale) {
			listeners.get("message")({
				source: parent,
				data: {
					jsonrpc: "2.0",
					id: "gitbutler-fallback-initialize",
					result: { hostContext: { locale } },
				},
			});
		},
	};
}

test("fallback follows host locale and keeps an explicit preference", () => {
	const app = mount();
	assert.equal(app.document.documentElement.lang, "en");
	assert.equal(app.sent[0].method, "ui/initialize");
	app.initialize("zh-CN");
	assert.equal(app.document.documentElement.lang, "zh-CN");
	assert.equal(app.sent[1].method, "ui/notifications/initialized");
	app.choose("en");
	app.host("zh-SG");
	assert.equal(app.document.documentElement.lang, "en");
	app.choose("system");
	assert.equal(app.document.documentElement.lang, "zh-CN");
	app.host("en-US", false);
	assert.equal(app.document.documentElement.lang, "zh-CN");
	app.host("zh-TW");
	assert.equal(app.document.documentElement.lang, "en");
});

test("storage denial leaves switching usable and displays a localized session hint", () => {
	const app = mount({ denied: true });
	app.choose("zh-CN");
	assert.equal(app.document.documentElement.lang, "zh-CN");
	assert.equal(app.nodes.get("notice").hidden, false);
	assert.equal(
		app.nodes.get("notice").textContent,
		"语言已在当前会话中切换，此环境不允许保存语言偏好。",
	);
	assert.match(app.nodes.get("title").textContent, /GitButler/);
});
