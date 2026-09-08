import { IpcError, isNormalizedError } from "$lib/error/normalizedError";
import { expect, test } from "vitest";

test("preserves the raw backend message and error code for local diagnostics", () => {
	const message = "Unable to fetch refs/heads/feature/test\n网络连接失败: C:\\work\\repo";
	const error = new IpcError({ message, code: "ProjectGitAuth" }, "git_fetch");
	expect(error).toBeInstanceOf(Error);
	expect(error.stack).toContain("git_fetch");
	expect(isNormalizedError(error)).toBe(true);
	expect(JSON.parse(JSON.stringify(error))).toMatchObject({
		name: "API error: (git_fetch)",
		origin: "ipc",
		message,
		code: "ProjectGitAuth",
	});
});
test("keeps a backend-provided error name", () => {
	expect(new IpcError({ message: "failed", name: "Repository unavailable" }, "open").name).toBe(
		"Repository unavailable",
	);
});
test("rejects malformed error payloads", () => {
	for (const error of [null, "failed", { message: 3 }, { message: "failed", code: 4 }])
		expect(isNormalizedError(error)).toBe(false);
});
