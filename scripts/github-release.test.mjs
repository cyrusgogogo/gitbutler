import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
	collectWindowsPackages,
	prepareRelease,
	publishWindowsRelease,
	releaseAssetNames,
	verifyReleaseAssets,
	versionFromRun,
} from "./github-release.mjs";

const version = "1.0.42";
const sha = "a".repeat(40);

function fixture(t, { lite = true } = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "gitbutler-release-"));
	t.after(() => {
		assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
		assert.ok(path.basename(root).startsWith("gitbutler-release-"));
		rmSync(root, { recursive: true, force: true });
	});
	const write = (relative, data) => {
		const file = path.join(root, relative);
		mkdirSync(path.dirname(file), { recursive: true });
		writeFileSync(file, data);
	};
	write(
		"crates/gitbutler-tauri/tauri.conf.release.json",
		JSON.stringify({
			productName: "GitButler",
			bundle: { externalBin: ["placeholder"], active: true },
		}),
	);
	write(
		"apps/lite/package.json",
		JSON.stringify({ name: "lite", version: "0.0.0-dev", build: { publish: [] } }),
	);
	write(
		`target/release/bundle/msi/GitButler_${version}_x64_en-US.msi`,
		Buffer.from("d0cf11e0a1b11ae11234", "hex"),
	);
	if (lite) write(`apps/lite/release/${releaseAssetNames(version)[1]}`, "MZ-test-package");
	return { root, write };
}

function fakeGithub({ release, branchSha = sha, lookupError, failUpload = false } = {}) {
	const calls = [];
	const record = (name, data) => {
		calls.push({ name, data });
	};
	const repos = {
		async getBranch() {
			return { data: { commit: { sha: branchSha } } };
		},
		async getReleaseByTag() {
			if (lookupError) throw lookupError;
			// GitHub's tag endpoint only returns published releases, not drafts.
			if (!release || release.draft) {
				throw Object.assign(new Error("Not found"), { status: 404 });
			}
			return { data: release };
		},
		async listReleases() {
			return { data: release ? [{ tag_name: `v${version}`, ...release }] : [] };
		},
		async createRelease(data) {
			record("create", data);
			return { data: { id: 7, draft: true, target_commitish: sha, assets: [] } };
		},
		async deleteReleaseAsset(data) {
			record("delete", data);
		},
		async uploadReleaseAsset(data) {
			record("upload", data);
			if (failUpload) throw new Error("Upload failed");
		},
		async updateRelease(data) {
			record("publish", data);
			return { data: { html_url: "https://github.com/test/repo/releases/tag/v1.0.42" } };
		},
	};
	return { rest: { repos }, calls };
}

function publish(github, directory) {
	return publishWindowsRelease(github, {
		owner: "test",
		repo: "repo",
		sha,
		version,
		directory,
		runUrl: "https://github.com/test/repo/actions/runs/42",
	});
}

test("versions increase with the workflow run and respect the MSI patch limit", () => {
	assert.equal(versionFromRun("1"), "1.0.1");
	assert.equal(versionFromRun("65535"), "1.0.65535");
	for (const invalid of [undefined, "", "0", "01", "-1", "1.5", "65536", "../42"]) {
		assert.throws(() => versionFromRun(invalid));
	}
});

test("preparation updates build versions and preserves all other application configuration", (t) => {
	const { root } = fixture(t);
	prepareRelease(root, version);
	assert.deepEqual(JSON.parse(readFileSync(path.join(root, "apps/lite/package.json"))), {
		name: "lite",
		version,
		build: { publish: [] },
	});
	assert.deepEqual(
		JSON.parse(readFileSync(path.join(root, "target/github-release/tauri.conf.json"))),
		{
			productName: "GitButler",
			version,
			bundle: { externalBin: ["gitbutler-git-askpass", "but"], active: true },
		},
	);
	assert.equal(
		JSON.parse(readFileSync(path.join(root, "crates/gitbutler-tauri/tauri.conf.release.json")))
			.version,
		undefined,
	);
});

test("both packages are required before assembling release assets", (t) => {
	const { root } = fixture(t, { lite: false });
	assert.throws(() => collectWindowsPackages(root, version), /ENOENT/);
	assert.equal(existsSync(path.join(root, "release/github")), false);
});

test("rejects a non-executable Lite download before uploading", (t) => {
	const { root, write } = fixture(t);
	write(`apps/lite/release/${releaseAssetNames(version)[1]}`, "<html>download failed</html>");
	assert.throws(() => collectWindowsPackages(root, version), /Invalid Windows package/);
});

test("detects changed assets after transport using the generated SHA-256 checksums", (t) => {
	const { root } = fixture(t);
	const directory = collectWindowsPackages(root, version);
	assert.equal(verifyReleaseAssets(directory, version).length, 3);
	writeFileSync(path.join(directory, releaseAssetNames(version)[1]), "MZ-changed");
	assert.throws(() => verifyReleaseAssets(directory, version), /checksum verification failed/);
});

test("publishes only after all three release assets have uploaded", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub();
	const result = await publish(github, collectWindowsPackages(root, version));
	assert.equal(result.published, true);
	assert.deepEqual(
		github.calls.map((call) => call.name),
		["create", "upload", "upload", "upload", "publish"],
	);
	assert.equal(github.calls[0].data.draft, true);
	assert.equal(github.calls[0].data.target_commitish, sha);
	assert.equal(github.calls.at(-1).data.draft, false);
});

test("an upload failure leaves the release unpublished", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub({ failUpload: true });
	await assert.rejects(publish(github, collectWindowsPackages(root, version)), /Upload failed/);
	assert.equal(
		github.calls.some((call) => call.name === "publish"),
		false,
	);
});

test("retries replace matching assets only in a draft belonging to the same commit", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub({
		release: {
			id: 7,
			draft: true,
			target_commitish: sha,
			assets: [{ id: 9, name: releaseAssetNames(version)[0] }],
		},
	});
	await publish(github, collectWindowsPackages(root, version));
	assert.deepEqual(
		github.calls.map((call) => call.name),
		["delete", "upload", "upload", "upload", "publish"],
	);
	assert.equal(github.calls[0].data.asset_id, 9);
});

test("retries leave an already published version unchanged", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub({
		release: {
			draft: false,
			target_commitish: sha,
			html_url: "https://github.com/test/repo/releases/tag/v1.0.42",
		},
	});
	const result = await publish(github, collectWindowsPackages(root, version));
	assert.equal(result.alreadyPublished, true);
	assert.deepEqual(github.calls, []);
});

test("finds an interrupted draft beyond the first page of releases", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub();
	const pages = [];
	github.rest.repos.listReleases = async ({ page }) => {
		pages.push(page);
		return {
			data:
				page === 1
					? Array.from({ length: 100 }, (_, index) => ({ tag_name: `other-${index}` }))
					: [{ id: 7, tag_name: `v${version}`, draft: true, target_commitish: sha, assets: [] }],
		};
	};
	const result = await publish(github, collectWindowsPackages(root, version));
	assert.equal(result.published, true);
	assert.deepEqual(pages, [1, 2]);
	assert.deepEqual(
		github.calls.map((call) => call.name),
		["upload", "upload", "upload", "publish"],
	);
});

test("a draft lookup error never creates a replacement release", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub();
	github.rest.repos.listReleases = async () => {
		throw Object.assign(new Error("Forbidden"), { status: 403 });
	};
	await assert.rejects(publish(github, collectWindowsPackages(root, version)), /Forbidden/);
	assert.deepEqual(github.calls, []);
});

test("a conflicting version never overwrites another commit's release", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub({ release: { draft: true, target_commitish: "b".repeat(40) } });
	await assert.rejects(publish(github, collectWindowsPackages(root, version)), /different commit/);
	assert.deepEqual(github.calls, []);
});

test("an outdated master build does not become the latest release", async (t) => {
	const { root } = fixture(t);
	const github = fakeGithub({ branchSha: "b".repeat(40) });
	assert.deepEqual(await publish(github, collectWindowsPackages(root, version)), {
		published: false,
		reason: "superseded",
	});
	assert.deepEqual(github.calls, []);
});

test("GitHub permission or network failures are not treated as a missing release", async (t) => {
	const { root } = fixture(t);
	const error = Object.assign(new Error("Forbidden"), { status: 403 });
	const github = fakeGithub({ lookupError: error });
	await assert.rejects(publish(github, collectWindowsPackages(root, version)), error);
	assert.deepEqual(github.calls, []);
});
