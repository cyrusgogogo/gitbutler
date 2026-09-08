import CredentialCheck from "$components/projectSettings/CredentialCheck.svelte";
import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { GitConfigService } from "$lib/config/gitConfigService";
import type { NormalizedError } from "$lib/error/normalizedError";

const projectId = "private-project";
const remoteName = "private-remote";
const branchName = "private-branch";

function renderCredentialCheck({
	fetchError,
	pushError,
}: {
	fetchError?: NormalizedError;
	pushError?: NormalizedError;
} = {}) {
	const gitConfig = {
		checkGitFetch: vi.fn(async () => {
			if (fetchError) throw fetchError;
		}),
		checkGitPush: vi.fn(async () => {
			if (pushError) throw pushError;
		}),
	} as unknown as GitConfigService;
	const context = new Map<any, any>([[GIT_CONFIG_SERVICE._key, gitConfig]]);

	render(CredentialCheck, {
		props: { projectId, remoteName, branchName, disabled: false },
		context,
	});

	return { gitConfig };
}

describe("CredentialCheck", () => {
	test("keeps a fetch failure visible and does not attempt push", async () => {
		const error: NormalizedError = {
			origin: "ipc",
			name: "Git fetch failed",
			message: "Credential helper failed for https://secret@example.com/private/repository.git",
			code: "ProjectGitAuth",
		};
		const { gitConfig } = renderCredentialCheck({ fetchError: error });
		const user = userEvent.setup();

		await user.click(screen.getByRole("button"));
		await screen.findByRole("button", { name: "Re-test credentials" });
		expect(gitConfig.checkGitFetch).toHaveBeenCalledWith(projectId, remoteName);

		expect(screen.getByText("There was a problem with your credentials")).toBeInTheDocument();
		expect(screen.getByText(error.message, { exact: false })).toBeInTheDocument();
		expect(gitConfig.checkGitPush).not.toHaveBeenCalled();
	});

	test("keeps a push failure visible", async () => {
		const error: NormalizedError = {
			origin: "ipc",
			name: "Git push failed",
			message: "Credential helper failed for /private/repository on private-branch",
			code: "Unknown",
		};
		const { gitConfig } = renderCredentialCheck({ pushError: error });
		const user = userEvent.setup();

		await user.click(screen.getByRole("button"));
		await screen.findByRole("button", { name: "Re-test credentials" });
		expect(gitConfig.checkGitFetch).toHaveBeenCalledWith(projectId, remoteName);

		expect(screen.getByText("There was a problem with your credentials")).toBeInTheDocument();
		expect(screen.getByText(error.message, { exact: false })).toBeInTheDocument();
		expect(gitConfig.checkGitPush).toHaveBeenCalledWith(projectId, remoteName, branchName);
	});

	test("shows success when both checks pass", async () => {
		const { gitConfig } = renderCredentialCheck();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button"));
		await screen.findByRole("button", { name: "Re-test credentials" });
		expect(gitConfig.checkGitFetch).toHaveBeenCalledWith(projectId, remoteName);

		expect(screen.getByText("All checks passed successfully")).toBeInTheDocument();
		expect(gitConfig.checkGitPush).toHaveBeenCalledWith(projectId, remoteName, branchName);
	});
});
