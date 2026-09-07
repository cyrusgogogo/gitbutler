import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "../test.ts";
import type { ElectronApplication } from "@playwright/test";

test.describe("application menu language", () => {
	test.use({ scenario: null });
	test("switches labels and restores the original menu without changing commands", async ({
		appWindow,
		electronApp,
	}) => {
		const readMenu = async (app: ElectronApplication) =>
			await app.evaluate(({ Menu }) => {
				function read(menu: Electron.Menu | null): Array<{
					label: string;
					role: string | undefined;
					commandId: number;
					accelerator: string | null;
				}> {
					return (
						menu?.items.flatMap((item) => [
							{
								label: item.label,
								role: item.role,
								commandId: item.commandId,
								accelerator: item.accelerator,
							},
							...read(item.submenu ?? null),
						]) ?? []
					);
				}
				return read(Menu.getApplicationMenu());
			});
		const original = await readMenu(electronApp);
		expect(original.some((item) => item.label === "File")).toBe(true);
		await appWindow.getByRole("combobox", { name: "Language", exact: true }).selectOption("zh-CN");
		await expect
			.poll(async () => (await readMenu(electronApp)).map((item) => item.label))
			.toContain("文件");
		const chinese = await readMenu(electronApp);
		expect(chinese.some((item) => item.label === "复制")).toBe(true);
		expect(chinese.map(({ label: _label, ...command }) => command)).toEqual(
			original.map(({ label: _label, ...command }) => command),
		);
		await appWindow.getByRole("combobox", { name: "语言", exact: true }).selectOption("en");
		await expect.poll(async () => await readMenu(electronApp)).toEqual(original);
	});
});

test.use({ scenario: "project-in-single-branch-three-branch-stack.sh" });

test("language switches preserve the project, checked file and commit draft", async ({
	appWindow,
	testEnvironment,
}, testInfo) => {
	const clone = path.join(testEnvironment.workdir, "local-clone");
	writeFileSync(path.join(clone, "language-draft.txt"), "original file content\n");
	await appWindow.reload();
	const checkbox = appWindow.getByRole("checkbox", { name: "Check file language-draft.txt" });
	await checkbox.click();
	await appWindow.getByRole("button", { name: /start commit/i }).press("Enter");
	await appWindow
		.getByRole("textbox", { name: "Compose commit message" })
		.fill("Keep this draft 原始提交说明");
	const route = appWindow.url();
	await appWindow.getByRole("button", { name: "Settings", exact: true }).press("Enter");
	await appWindow.getByRole("combobox", { name: "Language", exact: true }).selectOption("zh-CN");
	await expect(appWindow.locator("html")).toHaveAttribute("lang", "zh-CN");
	await testInfo.attach("settings-zh.png", {
		body: await appWindow.screenshot({ path: testInfo.outputPath("settings-zh.png") }),
		contentType: "image/png",
	});
	await appWindow.keyboard.press("Escape");
	await expect(appWindow).toHaveURL(route);
	await expect(appWindow.getByRole("textbox", { name: "编写提交说明" })).toHaveValue(
		"Keep this draft 原始提交说明",
	);
	await expect(
		appWindow.getByRole("checkbox", { name: "勾选文件 language-draft.txt" }),
	).toBeChecked();
	await testInfo.attach("workspace-zh.png", {
		body: await appWindow.screenshot({ path: testInfo.outputPath("workspace-zh.png") }),
		contentType: "image/png",
	});
	const saved = JSON.parse(
		readFileSync(path.join(testEnvironment.electronUserDataDir, "settings.json"), "utf8"),
	) as { language: string };
	expect(saved.language).toBe("zh-CN");
	await appWindow.reload();
	await expect(appWindow.locator("html")).toHaveAttribute("lang", "zh-CN");
	await expect(appWindow).toHaveURL(route);
	expect(readFileSync(path.join(clone, "language-draft.txt"), "utf8")).toBe(
		"original file content\n",
	);
});

test("a settings write failure retains the previous language and reports it", async ({
	appWindow,
	electronApp,
	testEnvironment,
}) => {
	await appWindow.getByRole("button", { name: "Settings", exact: true }).press("Enter");
	await electronApp.evaluate(({ ipcMain }) => {
		ipcMain.removeHandler("writeGUISettings");
		ipcMain.handle("writeGUISettings", () => {
			throw new Error("Simulated settings write failure");
		});
	});
	await appWindow.getByRole("combobox", { name: "Language", exact: true }).selectOption("zh-CN");
	await expect(appWindow.getByRole("status")).toContainText(
		"Could not save the language preference",
	);
	await expect(appWindow.getByRole("combobox", { name: "Language", exact: true })).toHaveValue(
		"en",
	);
	await expect(appWindow.locator("html")).toHaveAttribute("lang", "en");
	const saved = JSON.parse(
		readFileSync(path.join(testEnvironment.electronUserDataDir, "settings.json"), "utf8"),
	) as { language: string };
	expect(saved.language).toBe("en");
});
