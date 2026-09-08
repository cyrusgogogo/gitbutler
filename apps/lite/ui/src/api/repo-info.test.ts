import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import { forgeInfoOptions, repoInfoQueryOptions } from "#ui/api/queries.ts";

afterEach(() => vi.unstubAllGlobals());

test.each([null, { capabilities: { repoInfo: false } }])(
	"does not request unavailable repository metadata for forge %j",
	async (forge) => {
		const getRepoInfo = vi.fn().mockResolvedValue({ private: true, fork: false });
		vi.stubGlobal("window", { lite: { forgeInfo: vi.fn().mockResolvedValue(forge), getRepoInfo } });
		const client = new QueryClient();
		await expect(client.fetchQuery(repoInfoQueryOptions("local-project"))).resolves.toBeNull();
		expect(getRepoInfo).not.toHaveBeenCalled();
		client.clear();
	},
);

test("uses cached forge capabilities and preserves supported repository metadata", async () => {
	const metadata = { private: true, fork: false };
	const getRepoInfo = vi.fn().mockResolvedValue(metadata);
	const forgeInfo = vi.fn();
	vi.stubGlobal("window", { lite: { forgeInfo, getRepoInfo } });
	const client = new QueryClient();
	client.setQueryData(forgeInfoOptions("github-project").queryKey, {
		name: "github",
		baseUrl: "https://github.com/example/project",
		commitUrlPath: "/commit/",
		prUrlPath: "/pull/",
		unit: { name: "pull request", abbr: "PR", symbol: "#" },
		posthogLabel: "PR",
		capabilities: {
			repoInfo: true,
			checks: true,
			prService: true,
			listService: true,
			reviewComments: true,
			reviewManagement: true,
		},
	});
	await expect(client.fetchQuery(repoInfoQueryOptions("github-project"))).resolves.toEqual(
		metadata,
	);
	expect(forgeInfo).not.toHaveBeenCalled();
	expect(getRepoInfo).toHaveBeenCalledWith("github-project");
	client.clear();
});

test("keeps real request failures visible for a supported forge", async () => {
	const failure = new Error("Forge request failed");
	vi.stubGlobal("window", {
		lite: {
			forgeInfo: vi.fn().mockResolvedValue({ capabilities: { repoInfo: true } }),
			getRepoInfo: vi.fn().mockRejectedValue(failure),
		},
	});
	const client = new QueryClient();
	await expect(client.fetchQuery(repoInfoQueryOptions("github-project"))).rejects.toBe(failure);
	client.clear();
});
