import type common from "./locales/en/common.json";
import type desktop from "./locales/en/desktop.json";
import type lite from "./locales/en/lite.json";
import type mcp from "./locales/en/mcp.json";
import type native from "./locales/en/native.json";
import type shared from "./locales/en/shared.json";
import type ui from "./locales/en/ui.json";
import type web from "./locales/en/web.json";

type Catalogs = {
	common: typeof common;
	desktop: typeof desktop;
	lite: typeof lite;
	mcp: typeof mcp;
	native: typeof native;
	shared: typeof shared;
	ui: typeof ui;
	web: typeof web;
};
type PluralBase<Key extends string> =
	Key extends `${infer Base}_${"zero" | "one" | "two" | "few" | "many" | "other"}` ? Base : Key;

/** Derived from English catalogs. These imports emit no runtime resources. */
export type MessageKey = {
	[Namespace in keyof Catalogs]: `${Namespace}:${PluralBase<keyof Catalogs[Namespace] & string>}`;
}[keyof Catalogs];
