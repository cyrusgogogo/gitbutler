import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test("language switches keep the login draft and route, and survive reload", async ({
	page,
}, testInfo) => {
	await page.goto("/login");
	const email = page.getByRole("textbox", { name: "Email", exact: true });
	await email.fill("draft@example.test");
	await page.getByLabel("Password", { exact: true }).fill("local-draft-only");
	const route = page.url();
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
	await expect(page.getByRole("textbox", { name: "邮箱", exact: true })).toHaveValue(
		"draft@example.test",
	);
	await expect(page.getByLabel("密码", { exact: true })).toHaveValue("local-draft-only");
	await expect(page).toHaveURL(route);
	await testInfo.attach("login-zh.png", {
		body: await page.screenshot({ path: testInfo.outputPath("login-zh.png") }),
		contentType: "image/png",
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await page.screenshot({ path: testInfo.outputPath("login-zh-mobile.png"), fullPage: true });
	await page.reload();
	await expect(page.getByRole("combobox", { name: "语言" })).toHaveValue("zh-CN");
	await page.getByRole("combobox", { name: "语言" }).selectOption("system");
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await page.screenshot({ path: testInfo.outputPath("login-en-mobile.png"), fullPage: true });
});

test("a language change in another tab preserves the current form", async ({ page, context }) => {
	await page.goto("/login");
	await page
		.getByRole("textbox", { name: "Email", exact: true })
		.fill("another-draft@example.test");
	const other = await context.newPage();
	await other.goto("/login");
	await other.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await expect(page.getByRole("combobox", { name: "语言" })).toHaveValue("zh-CN");
	await expect(page.getByRole("textbox", { name: "邮箱", exact: true })).toHaveValue(
		"another-draft@example.test",
	);
	await other.close();
});
