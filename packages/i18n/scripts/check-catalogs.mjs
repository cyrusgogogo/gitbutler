import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = path.resolve(packageRoot, "../..");
const localesRoot = path.join(packageRoot, "src/locales");
const namespaces = fs
	.readdirSync(path.join(localesRoot, "en"))
	.filter((name) => name.endsWith(".json"));
const errors = [];
const knownKeys = new Set();
let messageCount = 0;
function tokens(text) {
	return [...new Set([...text.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]))].sort();
}

function tags(text, location) {
	const stack = [];
	const names = [];
	for (const match of text.matchAll(/<(\/?)([A-Za-z][\w-]*)(\s*\/)?>/g)) {
		const [, closing, name, selfClosing] = match;
		if (closing) {
			if (stack.pop() !== name) errors.push(`${location}: unbalanced rich slot ${match[0]}`);
		} else {
			names.push(name);
			if (!selfClosing) stack.push(name);
		}
	}
	// Literal command examples such as <branch> are not rich slots.
	return { names: names.sort(), unclosed: stack };
}

for (const filename of namespaces) {
	const namespace = filename.slice(0, -5);
	const en = JSON.parse(fs.readFileSync(path.join(localesRoot, "en", filename), "utf8"));
	const zh = JSON.parse(fs.readFileSync(path.join(localesRoot, "zh-CN", filename), "utf8"));
	try {
		assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
	} catch {
		errors.push(`${namespace}: English and Chinese keys differ`);
	}
	const plurals = new Set();
	for (const [key, original] of Object.entries(en)) {
		messageCount++;
		knownKeys.add(`${namespace}:${key}`);
		const plural = key.match(/^(.*)_(zero|one|two|few|many|other)$/);
		if (plural) {
			knownKeys.add(`${namespace}:${plural[1]}`);
			plurals.add(plural[1]);
		}
		const translated = zh[key];
		const location = `${namespace}:${key}`;
		if (
			typeof original !== "string" ||
			!original.trim() ||
			typeof translated !== "string" ||
			!translated.trim()
		) {
			errors.push(`${location}: empty or non-string message`);
			continue;
		}
		try {
			assert.deepEqual(tokens(translated), tokens(original));
		} catch {
			errors.push(`${location}: interpolation names differ`);
		}
		const enTags = tags(original, `en ${location}`);
		const zhTags = tags(translated, `zh-CN ${location}`);
		try {
			assert.deepEqual(zhTags, enTags);
		} catch {
			errors.push(`${location}: rich slots or literal angle-bracket tokens differ`);
		}
		if (/<\/script/i.test(original) || /<\/script/i.test(translated))
			errors.push(`${location}: unsafe embedded JSON terminator`);
	}
	for (const base of plurals) {
		if (!(base + "_one" in en) || !(base + "_other" in en))
			errors.push(`${namespace}:${base}: requires English one/other forms`);
	}
}

function visit(directory) {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			visit(file);
			continue;
		}
		if (
			!/\.(?:svelte|tsx?|jsx?|json)$/.test(entry.name) ||
			/(?:\.test\.|\.spec\.|\.stories\.)/.test(entry.name)
		)
			continue;
		const source = fs.readFileSync(file, "utf8");
		for (const match of source.matchAll(
			/["'`]((?:common|desktop|lite|web|ui|shared|mcp|native):[^"'`\r\n]+)["'`]/g,
		)) {
			const key = match[1];
			if (key.includes("${")) continue;
			if (!knownKeys.has(key)) errors.push(`${path.relative(repoRoot, file)}: unknown key ${key}`);
		}
	}
}
for (const directory of [
	"apps/desktop/src",
	"apps/web/src",
	"apps/lite/ui/src",
	"apps/lite/electron/src",
	"packages/ui/src",
	"packages/shared/src",
	"packages/but-mcp-app/src",
])
	visit(path.join(repoRoot, directory));

if (errors.length) {
	console.error(errors.join("\n"));
	process.exitCode = 1;
} else {
	process.stdout.write(
		`Validated ${messageCount} messages in ${namespaces.length} namespaces: locale parity, placeholders, slots, plurals, and source keys.\n`,
	);
}
