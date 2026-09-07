import type { MessageKey } from "@gitbutler/i18n";
// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { act, useEffect, useState, type FC } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createI18n, message } from "@gitbutler/i18n";
import { I18nProvider, Message, RichMessage, useTranslations } from "@gitbutler/i18n/react";

let root: Root | undefined;
async function flush(action: () => void) {
	await act(async () => {
		action();
		await Promise.resolve();
	});
}
afterEach(async () => {
	await flush(() => root?.unmount());
	document.body.replaceChildren();
});

it("updates the React Compiler's translated output without remounting a draft or queued toast", async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	const i18n = createI18n({
		en: { test: { title: "Commit", saved: "Saved {{name}}" } },
		"zh-CN": { test: { title: "提交", saved: "已保存 {{name}}" } },
	});
	const queued = message("test:saved" as MessageKey, { name: "feature/原始分支" });
	function Draft() {
		const { t } = useTranslations();
		const [draft, setDraft] = useState("fix: retain this message");
		return (
			<>
				<h1>{t("test:title" as MessageKey)}</h1>
				<input
					aria-label="draft"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
				/>
				<Message value={queued} />
			</>
		);
	}
	const container = document.createElement("div");
	document.body.append(container);
	const mountedRoot = createRoot(container);
	root = mountedRoot;
	await flush(() =>
		mountedRoot.render(
			<I18nProvider i18n={i18n}>
				<Draft />
			</I18nProvider>,
		),
	);
	const input = container.querySelector("input");
	if (!input) throw new Error("Draft input was not rendered");
	input.focus();
	input.setSelectionRange(5, 10);
	await flush(() => i18n.setLocale("zh-CN"));
	const after = container.querySelector("input");
	// The same DOM node carries focus, selection, and the draft across the language change.
	expect(after).toBe(input);
	expect(document.activeElement).toBe(input);
	expect(input.value).toBe("fix: retain this message");
	expect([input.selectionStart, input.selectionEnd]).toEqual([5, 10]);
	expect(container.querySelector("h1")?.textContent).toBe("提交");
	expect(container.textContent).toContain("已保存 feature/原始分支");
});

it("updates rich slots while preserving raw code and escaping interpolated markup", async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	const i18n = createI18n({
		en: { test: { rich: "Run <code></code> for <strong>{{name}}</strong>" } },
		"zh-CN": { test: { rich: "为<strong>{{name}}</strong>运行 <code></code>" } },
	});
	const value = message("test:rich" as MessageKey, { name: "<script>unsafe</script>" });
	const container = document.createElement("div");
	document.body.append(container);
	const mountedRoot = createRoot(container);
	root = mountedRoot;
	await flush(() =>
		mountedRoot.render(
			<I18nProvider i18n={i18n}>
				<RichMessage
					value={value}
					components={{ code: <code>git status</code>, strong: <strong /> }}
				/>
			</I18nProvider>,
		),
	);
	expect(container.textContent).toBe("Run git status for <script>unsafe</script>");
	await flush(() => i18n.setLocale("zh-CN"));
	expect(container.textContent).toBe("为<script>unsafe</script>运行 git status");
	expect(container.querySelector("code")?.textContent).toBe("git status");
	expect(container.querySelector("script")).toBeNull();
});

it("keeps translation dependencies stable during unrelated parent renders", async () => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	const i18n = createI18n({
		en: { common: { save: "Save" } },
		"zh-CN": { common: { save: "保存" } },
	});
	const snapshots: Array<ReturnType<typeof useTranslations>> = [];
	const Probe: FC<{ tick: number }> = ({ tick }) => {
		const translations = useTranslations();
		useEffect(() => {
			snapshots.push(translations);
		}, [tick, translations]);
		return (
			<span>
				{tick}: {translations.t("common:save")}
			</span>
		);
	};
	const container = document.createElement("div");
	document.body.append(container);
	const mountedRoot = createRoot(container);
	root = mountedRoot;
	await flush(() =>
		mountedRoot.render(
			<I18nProvider i18n={i18n}>
				<Probe tick={1} />
			</I18nProvider>,
		),
	);
	await flush(() =>
		mountedRoot.render(
			<I18nProvider i18n={i18n}>
				<Probe tick={2} />
			</I18nProvider>,
		),
	);
	expect(snapshots).toHaveLength(2);
	expect(snapshots[1]).toBe(snapshots[0]);
	await flush(() => i18n.setLocale("zh-CN"));
	expect(snapshots).toHaveLength(3);
	expect(snapshots[2]).not.toBe(snapshots[1]);
	expect(container.textContent).toBe("2: 保存");
});
