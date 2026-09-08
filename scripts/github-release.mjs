import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function versionFromRun(runNumber) {
	if (!/^[1-9]\d*$/.test(String(runNumber)) || Number(runNumber) > 65535) {
		throw new Error("Release run number must be between 1 and 65535 (Windows MSI version limit).");
	}
	return `1.0.${runNumber}`;
}

export function releaseAssetNames(version) {
	if (!/^1\.0\.[1-9]\d*$/.test(version) || versionFromRun(version.slice(4)) !== version) {
		throw new Error(`Invalid automatic release version: ${version}`);
	}
	return [
		`GitButler-Desktop-${version}-windows-x64.msi`,
		`GitButler-Lite-${version}-windows-x64.exe`,
	];
}

/** Generate build-only versions without committing version bumps back to master. */
export function prepareRelease(root, version) {
	releaseAssetNames(version);
	const readJson = (relative) => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
	const desktop = readJson("crates/gitbutler-tauri/tauri.conf.release.json");
	desktop.version = version;
	desktop.bundle.externalBin = ["gitbutler-git-askpass", "but"];
	const configDirectory = path.join(root, "target/github-release");
	mkdirSync(configDirectory, { recursive: true });
	writeFileSync(path.join(configDirectory, "tauri.conf.json"), JSON.stringify(desktop, null, 2));

	const lite = readJson("apps/lite/package.json");
	lite.version = version;
	writeFileSync(path.join(root, "apps/lite/package.json"), `${JSON.stringify(lite, null, "\t")}\n`);
}

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

function readPackage(file, magic) {
	const data = readFileSync(file);
	if (!data.subarray(0, magic.length).equals(magic)) {
		throw new Error(`Invalid Windows package: ${file}`);
	}
	return data;
}

/** Require both packages before creating the upload directory or its checksums. */
export function collectWindowsPackages(root, version) {
	const names = releaseAssetNames(version);
	const msiDirectory = path.join(root, "target/release/bundle/msi");
	const installers = readdirSync(msiDirectory).filter(
		(name) => name.startsWith(`GitButler_${version}_x64_`) && name.endsWith(".msi"),
	);
	if (installers.length !== 1) {
		throw new Error(`Expected one Desktop MSI for ${version}, found ${installers.length}.`);
	}
	const sources = [
		path.join(msiDirectory, installers[0]),
		path.join(root, "apps/lite/release", names[1]),
	];
	const packages = [
		readPackage(sources[0], Buffer.from("d0cf11e0a1b11ae1", "hex")),
		readPackage(sources[1], Buffer.from("MZ")),
	];
	const destination = path.join(root, "release/github");
	mkdirSync(destination, { recursive: true });
	for (const [index, name] of names.entries()) {
		copyFileSync(sources[index], path.join(destination, name));
	}
	writeFileSync(
		path.join(destination, "SHA256SUMS.txt"),
		packages.map((data, index) => `${sha256(data)}  ${names[index]}\n`).join(""),
	);
	return destination;
}

/** Check the downloaded build artifact again before any GitHub release mutation. */
export function verifyReleaseAssets(directory, version) {
	const names = releaseAssetNames(version);
	const expectedFiles = [...names, "SHA256SUMS.txt"].sort();
	if (JSON.stringify(readdirSync(directory).sort()) !== JSON.stringify(expectedFiles)) {
		throw new Error(
			"Release assets must contain exactly the Desktop MSI, Lite EXE, and checksums.",
		);
	}
	const expectedChecksums = names
		.map((name) => `${sha256(readFileSync(path.join(directory, name)))}  ${name}\n`)
		.join("");
	if (readFileSync(path.join(directory, "SHA256SUMS.txt"), "utf8") !== expectedChecksums) {
		throw new Error("Release asset checksum verification failed.");
	}
	return [...names, "SHA256SUMS.txt"];
}

/** Publish only a complete build of current master; retries never replace a published version. */
export async function publishWindowsRelease(
	github,
	{ owner, repo, sha, version, directory, runUrl },
) {
	const names = verifyReleaseAssets(directory, version);
	const repository = { owner, repo };
	const { data: branch } = await github.rest.repos.getBranch({ ...repository, branch: "master" });
	if (branch.commit.sha !== sha) return { published: false, reason: "superseded" };

	const tag = `v${version}`;
	let release;
	try {
		({ data: release } = await github.rest.repos.getReleaseByTag({ ...repository, tag }));
	} catch (error) {
		if (error.status !== 404) throw error;
		// The tag endpoint excludes drafts. Find an interrupted publication in the release list.
		for (let page = 1; ; page++) {
			const { data } = await github.rest.repos.listReleases({
				...repository,
				per_page: 100,
				page,
			});
			release = data.find((candidate) => candidate.tag_name === tag);
			if (release || data.length < 100) break;
		}
	}
	if (release) {
		if (release.target_commitish !== sha) {
			throw new Error(`Release ${tag} belongs to a different commit; refusing to overwrite it.`);
		}
		if (!release.draft) return { published: true, url: release.html_url, alreadyPublished: true };
	} else {
		({ data: release } = await github.rest.repos.createRelease({
			...repository,
			tag_name: tag,
			target_commitish: sha,
			name: `GitButler 本地版 ${tag}`,
			draft: true,
			prerelease: false,
			body: [
				"由 GitHub Actions 自动编译的 Windows x64 版本。",
				"",
				"- Desktop：下载 `.msi` 安装包。",
				"- Lite：下载 `.exe` 便携版。",
				"- `SHA256SUMS.txt`：安装文件的 SHA-256 校验值。",
				"",
				"本次构建未使用代码签名证书，Windows 可能显示未知发布者提示。",
				"",
				`源码提交：[${sha.slice(0, 10)}](https://github.com/${owner}/${repo}/commit/${sha})`,
				`构建记录：[GitHub Actions](${runUrl})`,
			].join("\n"),
		}));
	}

	for (const name of names) {
		const previous = release.assets.find((asset) => asset.name === name);
		if (previous) {
			await github.rest.repos.deleteReleaseAsset({ ...repository, asset_id: previous.id });
		}
		const data = readFileSync(path.join(directory, name));
		await github.rest.repos.uploadReleaseAsset({
			...repository,
			release_id: release.id,
			name,
			data,
			headers: { "content-type": "application/octet-stream", "content-length": data.length },
		});
	}
	const { data: published } = await github.rest.repos.updateRelease({
		...repository,
		release_id: release.id,
		draft: false,
		make_latest: "true",
	});
	return { published: true, url: published.html_url, alreadyPublished: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const version = versionFromRun(process.env.GITHUB_RUN_NUMBER);
	if (process.argv[2] === "prepare") {
		prepareRelease(process.cwd(), version);
	} else if (process.argv[2] === "collect") {
		const directory = collectWindowsPackages(process.cwd(), version);
		verifyReleaseAssets(directory, version);
	} else {
		throw new Error("Usage: node scripts/github-release.mjs <prepare|collect>");
	}
	console.log(`Prepared ${process.argv[2]} for v${version}`);
}
