import {
	createI18n,
	type I18n,
	type LocalizedText,
	type MessageDescriptor,
	type MessagePart,
} from "./index.js";
import {
	cloneElement,
	createContext,
	useContext,
	useMemo,
	useSyncExternalStore,
	type ReactNode,
	type ReactElement,
} from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

const I18nContext = createContext<I18n | undefined>(undefined);
let fallback = createI18n({ en: {} });

/** English runtime for isolated component tests; production roots use I18nProvider. */
export function setFallbackI18n(i18n: I18n): void {
	fallback = i18n;
}

export function I18nProvider({ i18n, children }: { i18n: I18n; children?: ReactNode }) {
	return (
		<I18nContext.Provider value={i18n}>
			<I18nextProvider i18n={i18n.engine}>{children}</I18nextProvider>
		</I18nContext.Provider>
	);
}

/** The context identity stays stable; only an actual locale change wakes subscribers. */
export function useTranslations() {
	const i18n = useContext(I18nContext) ?? fallback;
	const { t: translate } = useTranslation(undefined, { i18n: i18n.engine, useSuspense: false });
	const locale = useSyncExternalStore(i18n.subscribe, i18n.getSnapshot, i18n.getSnapshot);
	// Translation identities change with locale so the React Compiler cannot reuse old text.
	const translations = useMemo(
		() => ({
			t: (key: Parameters<I18n["t"]>[0], values?: Parameters<I18n["t"]>[1]) =>
				translate(key, i18n.resolveValues(values)),
			text: (value: LocalizedText) =>
				typeof value === "string" ? value : translate(value.key, i18n.resolveValues(value.values)),
			parts: (value: MessageDescriptor) => i18n.parts(value, translate),
		}),
		[translate, i18n],
	);
	return useMemo(() => ({ ...translations, locale, i18n }), [translations, locale, i18n]);
}

export function Message({ value }: { value: LocalizedText }) {
	const { text } = useTranslations();
	return text(value);
}

export function RichMessage({
	value,
	components,
}: {
	value: MessageDescriptor;
	components: Record<string, ReactElement>;
}) {
	const { parts } = useTranslations();
	function renderParts(parts: MessagePart[]): ReactNode[] {
		return parts.map((part, index) => {
			if (part.type === "text") return part.text;
			const children = renderParts(part.children);
			const component = components[part.name];
			if (!component) return children;
			return part.children.length
				? cloneElement(component, { key: index }, children)
				: cloneElement(component, { key: index });
		});
	}
	return renderParts(parts(value));
}
