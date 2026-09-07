import { errorToLoadable, isError } from "$lib/network/loadable";
import { ApiError, toSerializable } from "$lib/network/types";
import { createI18n, message } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/shared";
import { describe, expect, it } from "vitest";

describe("localized network errors", () => {
	it("keeps the diagnostic and deferred translation through the serialized cache", () => {
		const error = new ApiError(
			"Login expired",
			new Response(null, { status: 401 }),
			message("shared:network.loginExpired"),
		);
		const stored = JSON.parse(JSON.stringify(errorToLoadable(error, "project-1")));
		expect(isError(stored)).toBe(true);
		expect(stored.error.message).toBe("Login expired");
		const i18n = createI18n(resources);
		expect(i18n.text(stored.error.localized)).toBe(resources.en.shared["network.loginExpired"]);
		i18n.setLocale("zh-CN");
		expect(i18n.text(stored.error.localized)).toBe(
			resources["zh-CN"].shared["network.loginExpired"],
		);
	});
	it("preserves remote messages and the existing not-found classification", () => {
		const error = new ApiError("remote: permission denied", new Response(null, { status: 403 }));
		expect(toSerializable(error)).toMatchObject({ message: "remote: permission denied" });
		expect(toSerializable(error)).not.toHaveProperty("localized");
		expect(
			errorToLoadable(new ApiError("not found", new Response(null, { status: 404 })), "missing"),
		).toEqual({ status: "not-found", id: "missing" });
	});
});
