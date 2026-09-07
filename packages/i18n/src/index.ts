import HTML from "html-parse-stringify";
import i18next from "i18next";
import type { MessageKey } from "./keys.js";
import type { i18n as I18next, Resource } from "i18next";
export type { MessageKey } from "./keys.js";

export type Locale = "en" | "zh-CN";
export type LanguagePreference = "system" | Locale;
export type MessageValues = { [name: string]: string | number | MessageDescriptor };
export type MessageDescriptor = { key: string; values?: MessageValues };
export type LocalizedText = string | MessageDescriptor;
export type MessagePart =
	| { type: "text"; text: string }
	| { type: "tag"; name: string; children: MessagePart[] };

/** Keep messages as data until they are displayed, including queued notifications. */
export function message(key: MessageKey, values?: MessageValues): MessageDescriptor {
	return values === undefined ? { key } : { key, values };
}

/** App-owned errors retain an English diagnostic and a message for the current UI locale. */
export class LocalizedError extends Error {
	constructor(
		readonly localized: LocalizedText,
		diagnostic: string,
	) {
		super(diagnostic);
	}
}

export function errorText(error: unknown, fallback: LocalizedText): LocalizedText {
	if (error instanceof LocalizedError) return error.localized;
	if (error instanceof Error) return error.message;
	return fallback;
}

export function normalizePreference(value: unknown): LanguagePreference {
	return value === "en" || value === "zh-CN" ? value : "system";
}

export function resolveLocale(preference: LanguagePreference, systemLocale?: string): Locale {
	if (preference !== "system") return preference;
	if (!systemLocale) return "en";
	try {
		const locale = new Intl.Locale(systemLocale.replaceAll("_", "-")).maximize();
		return locale.language === "zh" && locale.script === "Hans" ? "zh-CN" : "en";
	} catch {
		return "en";
	}
}

/** All resources are bundled; initialization and switching never perform network requests. */
export class I18n {
	readonly engine: I18next;
	#locale: Locale;
	#listeners = new Set<() => void>();

	constructor(resources: Resource, locale: Locale = "en") {
		this.#locale = locale;
		this.engine = i18next.createInstance();
		void this.engine.init({
			resources,
			lng: locale,
			fallbackLng: "en",
			supportedLngs: ["en", "zh-CN"],
			load: "currentOnly",
			ns: Object.keys(resources.en ?? {}),
			defaultNS: "common",
			keySeparator: false,
			initAsync: false,
			returnNull: false,
			interpolation: { escapeValue: false },
		});
	}

	get locale(): Locale {
		return this.#locale;
	}
	getSnapshot = (): Locale => this.#locale;

	subscribe = (listener: () => void): (() => void) => {
		this.#listeners.add(listener);
		return () => {
			this.#listeners.delete(listener);
		};
	};

	setLocale(locale: Locale): void {
		if (locale === this.#locale) return;
		this.#locale = locale;
		void this.engine.changeLanguage(locale);
		for (const listener of this.#listeners) listener();
	}

	resolveValues(
		values: MessageValues | undefined,
		locale: Locale = this.locale,
	): Record<string, string | number> {
		return Object.fromEntries(
			Object.entries(values ?? {}).map(([name, value]) => [
				name,
				typeof value === "object"
					? this.engine.getFixedT(locale)(value.key, this.resolveValues(value.values, locale))
					: value,
			]),
		);
	}

	t = (key: MessageKey, values?: MessageValues): string =>
		this.engine.t(key, this.resolveValues(values, this.locale));

	error(key: MessageKey, values?: MessageValues): LocalizedError {
		return new LocalizedError(
			message(key, values),
			this.engine.getFixedT("en")(key, this.resolveValues(values, "en")),
		);
	}

	/** Strings are raw content, never lookup keys: branch names and errors must stay intact. */
	text = (value: LocalizedText): string =>
		typeof value === "string"
			? value
			: this.engine.t(value.key, this.resolveValues(value.values, this.locale));

	parts(value: MessageDescriptor, translate: I18next["t"] = this.engine.t): MessagePart[] {
		const translated = translate(value.key, {
			...this.resolveValues(value.values, this.locale),
			interpolation: { escapeValue: true },
		});
		// Slot names are not HTML tags. In particular, "link" must not become a void element.
		const slots = translated.replace(/<(\/?)([A-Za-z][\w-]*)(?=[\s/>])/g, "<$1gb-$2");
		return toParts(HTML.parse(slots));
	}
}

export function createI18n(resources: Resource, locale: Locale = "en"): I18n {
	return new I18n(resources, locale);
}

type ParsedNode = { type: string; name?: string; content?: string; children?: ParsedNode[] };

function toParts(nodes: ParsedNode[]): MessagePart[] {
	return nodes.flatMap((node): MessagePart[] => {
		if (node.type === "text") return [{ type: "text", text: unescapeText(node.content ?? "") }];
		if (node.type === "tag" && node.name) {
			return [
				{
					type: "tag",
					name: node.name.replace(/^gb-/, ""),
					children: toParts(node.children ?? []),
				},
			];
		}
		return [];
	});
}

function unescapeText(text: string): string {
	const entities: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#39;": "'",
		"&#x27;": "'",
		"&#x2F;": "/",
		"&#x3D;": "=",
		"&#96;": "`",
	};
	return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F|#x3D|#96);/g, (entity) => entities[entity]);
}

export function bindDocumentLanguage(i18n: I18n, document: Document): () => void {
	function update() {
		document.documentElement.lang = i18n.locale;
	}
	update();
	return i18n.subscribe(update);
}
