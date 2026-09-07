import I18nForm from "$lib/testing/I18nForm.svelte";
import { createI18n } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/desktop";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { expect, it } from "vitest";

it("updates existing Svelte validation without replacing the input or its draft", async () => {
	const i18n = createI18n(resources, "en");
	const rendered = render(I18nForm, { i18n });
	const input = screen.getByRole("textbox");
	if (!(input instanceof HTMLInputElement)) throw new Error("The form must keep its native input");
	await fireEvent.change(input);
	await tick();
	expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
	input.focus();
	input.setSelectionRange(2, 6);
	i18n.setLocale("zh-CN");
	await tick();
	expect(screen.getByRole("textbox")).toBe(input);
	expect(input.value).toBe("an-invalid-email");
	expect(document.activeElement).toBe(input);
	expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
	expect(screen.getByText("请输入有效的邮箱地址。")).toBeInTheDocument();
	rendered.unmount();
});
