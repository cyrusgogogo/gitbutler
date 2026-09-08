import { appendFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { resolveLocale } from "@gitbutler/i18n";
import { expect, test as base } from "../test.ts";

const freshTest = base.extend({
	testEnvironment: async ({ testEnvironment }, provide) => {
		unlinkSync(path.join(testEnvironment.electronUserDataDir, "settings.json"));
		await provide(testEnvironment);
	},
});

freshTest.describe("first launch", () => {
	freshTest.use({ scenario: null });
	freshTest(
		"first launch follows the system language without a settings file",
		async ({ appWindow, electronApp }) => {
			const systemLocale = await electronApp.evaluate(({ app }) => app.getSystemLocale());
			await expect(appWindow.locator("html")).toHaveAttribute(
				"lang",
				resolveLocale("system", systemLocale),
			);
			const language = appWindow.getByRole("combobox", { name: /^(Language|语言)$/ });
			await expect(language).toHaveValue("system");
			await language.selectOption("zh-CN");
			await expect(
				appWindow.getByRole("heading", { name: "欢迎使用 GitButler Lite" }),
			).toBeVisible();
		},
	);
});

const test = base.extend({
	testEnvironment: async ({ testEnvironment }, provide) => {
		appendFileSync(
			testEnvironment.gitConfig,
			"\n[gitbutler]\n\taiModelProvider = openai\n\taiOpenAIKeyOption = butlerAPI\n",
		);
		await provide(testEnvironment);
	},
});

test.use({ scenario: "project-in-single-branch-three-branch-stack.sh" });

test("local settings keep custom AI and forge integrations without official account features", async ({
	appWindow,
}, testInfo) => {
	await appWindow.getByRole("button", { name: "Settings", exact: true }).press("Enter");
	const dialog = appWindow.getByRole("dialog");
	await expect(dialog.getByText("Account", { exact: true })).toHaveCount(0);
	await expect(dialog.getByText(/automatic updates/i)).toHaveCount(0);
	await expect(dialog.getByText("Discord", { exact: true })).toHaveCount(0);
	await dialog.getByRole("button", { name: "AI", exact: true }).first().click();
	await expect(dialog.locator("#openai-api-key")).toBeVisible();
	await expect(dialog.locator("#openai-endpoint")).toBeVisible();
	await expect(dialog.getByText(/sign in|GitButler API|credentials source/i)).toHaveCount(0);
	await dialog.locator("#ai-provider").selectOption("anthropic");
	await expect(dialog.locator("#anthropic-api-key")).toBeVisible();
	await dialog.getByRole("button", { name: "Integrations", exact: true }).click();
	await expect(dialog.getByText("GitHub", { exact: true })).toBeVisible();
	await expect(dialog.getByText("GitLab", { exact: true })).toBeVisible();
	await testInfo.attach("local-integrations.png", {
		body: await appWindow.screenshot(),
		contentType: "image/png",
	});
});
