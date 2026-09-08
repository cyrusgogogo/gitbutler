import { exposedEndpoints } from "../../electron/src/ipc.ts";
import { expect, test } from "vitest";

test("exposes repository and forge operations without official account or upload APIs", () => {
	for (const endpoint of [
		"getUserProfileLocal",
		"updateProfileAndPersist",
		"uploadFile",
		"loginAndPersist",
		"deleteUser",
		"getLoginToken",
	])
		expect(exposedEndpoints).not.toContain(endpoint);

	for (const endpoint of ["listProjectsStateless", "storeGithubPat", "storeGitlabPat"])
		expect(exposedEndpoints).toContain(endpoint);
});
