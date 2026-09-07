import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

async function host(page: Page, surface: string, denied = false) {
	page.on("pageerror", (error) => console.error(error));
	const html = readFileSync(
		new URL(`../../../crates/but/src/command/mcp/${surface}.html`, import.meta.url),
		"utf8",
	);
	await page.route("http://mcp.test/**", async (route) => {
		if (route.request().url().endsWith("/card.html")) {
			const storage = denied
				? '<script>Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Denied", "SecurityError"); } });</script>'
				: "";
			return await route.fulfill({
				contentType: "text/html",
				body: html.replace("<head>", `<head>${storage}`),
			});
		}
		return await route.fulfill({
			contentType: "text/html",
			body: `<!doctype html><html><body><script>
			addEventListener("message", ({ source, data }) => {
				if (data.method === "ui/initialize") setTimeout(() => source.postMessage({
					jsonrpc: "2.0", id: data.id,
					result: { protocolVersion: "2026-01-26", hostInfo: {name: "Language test", version: "1"}, hostCapabilities: {}, hostContext: {locale: "zh-CN", theme: "light"} }
				}, "*"), 50);
			});</script><iframe title="GitButler" src="/card.html" style="border:0;width:100%;height:680px"></iframe></body></html>`,
		});
	});
	await page.goto("http://mcp.test/host.html");
	return page.frameLocator("iframe");
}

async function notify(page: Page, method: string, params: Record<string, unknown>) {
	await page.evaluate(
		({ method, params }) => {
			document
				.querySelector("iframe")
				?.contentWindow?.postMessage({ jsonrpc: "2.0", method, params }, "*");
		},
		{ method, params },
	);
}

for (const surface of ["workspace", "review"]) {
	test(`${surface}: renders Chinese data and a narrow dark card`, async ({ page }, testInfo) => {
		const card = await host(page, surface);
		await expect(card.locator("html")).toHaveAttribute("lang", "zh-CN");
		const repository = { name: "Original repository 原始名称", path: "/work/original-repository" };
		const structuredContent =
			surface === "workspace"
				? {
						version: 1,
						repository,
						summary: { stacks: 0, branches: 0, commits: 0 },
						workspace: { stacks: [] },
					}
				: {
						version: 1,
						repository,
						forge: { name: "github", unit: { abbr: "PR", symbol: "#" } },
						reviews: [
							{
								number: 12,
								title: "Original PR title 原始标题",
								url: "https://example.test/pr/12",
								state: "draft",
								sourceBranch: "feature/original-branch",
								targetBranch: "main",
								author: { login: "original-author" },
								reviewers: [],
								labels: ["original-label"],
								createdAt: "2026-09-01T12:00:00Z",
								canMarkReady: false,
								ci: {
									status: "success",
									total: 1,
									passing: 1,
									pending: 0,
									failing: 0,
									failingCheckNames: [],
								},
							},
						],
					};
		await notify(page, "ui/notifications/tool-result", { content: [], structuredContent });
		await expect(card.getByRole("heading", { name: repository.name, exact: true })).toBeVisible();
		if (surface === "review")
			await expect(card.getByText("Original PR title 原始标题", { exact: true })).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath(`${surface}-content-zh.png`) });
		await page.setViewportSize({ width: 360, height: 740 });
		await notify(page, "ui/notifications/host-context-changed", { theme: "dark" });
		await expect(card.getByRole("heading", { name: repository.name, exact: true })).toBeVisible();
		await expect
			.poll(
				async () =>
					await card
						.locator("html")
						.evaluate((element) => element.scrollWidth <= element.clientWidth),
			)
			.toBe(true);
		await page.screenshot({ path: testInfo.outputPath(`${surface}-content-zh-narrow-dark.png`) });
		await card.getByRole("combobox").selectOption("en");
		await expect(card.getByRole("heading", { name: repository.name, exact: true })).toBeVisible();
	});

	test(`${surface}: follows host and preserves a saved override`, async ({ page }, testInfo) => {
		const card = await host(page, surface);
		await expect(card.locator("html")).toHaveAttribute("lang", "zh-CN");
		await expect(card.getByRole("combobox", { name: "语言" })).toHaveValue("system");
		await testInfo.attach(`${surface}-zh.png`, {
			body: await page.screenshot({ path: testInfo.outputPath(`${surface}-zh.png`) }),
			contentType: "image/png",
		});
		await card.getByRole("combobox").selectOption("en");
		await notify(page, "ui/notifications/host-context-changed", { locale: "zh-SG" });
		await expect(card.locator("html")).toHaveAttribute("lang", "en");
		await card.getByRole("combobox").selectOption("system");
		await expect(card.locator("html")).toHaveAttribute("lang", "zh-CN");
		await notify(page, "ui/notifications/host-context-changed", { locale: "en-US" });
		await expect(card.locator("html")).toHaveAttribute("lang", "en");
		const raw = "<script>window.injected = true</script> fatal: original Git error";
		await notify(page, "ui/notifications/tool-result", {
			isError: true,
			content: [{ type: "text", text: raw }],
		});
		await expect(card.getByText(raw, { exact: true })).toBeVisible();
		await card.getByRole("combobox").selectOption("zh-CN");
		await expect(card.getByText(raw, { exact: true })).toBeVisible();
		await page.reload();
		await expect(card.getByRole("combobox")).toHaveValue("zh-CN");
		await expect(card.locator("html")).toHaveAttribute("lang", "zh-CN");
	});

	test(`${surface}: storage denial permits switching for this session`, async ({ page }) => {
		const card = await host(page, surface, true);
		await expect(card.locator("html")).toHaveAttribute("lang", "zh-CN");
		await card.getByRole("combobox").selectOption("en");
		await expect(card.locator("html")).toHaveAttribute("lang", "en");
		await expect(card.getByRole("status")).toContainText("session");
	});
}
