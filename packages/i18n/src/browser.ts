import { normalizePreference, resolveLocale, type I18n, type LanguagePreference } from "./index.js";

/** Browser-local preference. Storage denial is reported while the session stays usable. */
export function browserLanguage(
	i18n: I18n,
	key: string,
	getSystemLocale = () => navigator.language,
) {
	let preference: LanguagePreference = "system";
	const listeners = new Set<() => void>();
	try {
		preference = normalizePreference(localStorage.getItem(key));
	} catch {
		/* Sandboxed hosts can deny storage. */
	}
	function update() {
		i18n.setLocale(resolveLocale(preference, getSystemLocale()));
		for (const listener of listeners) listener();
	}
	update();
	function storageChanged(event: StorageEvent) {
		if (event.key !== key && event.key !== null) return;
		preference = normalizePreference(event.newValue);
		update();
	}
	window.addEventListener("languagechange", update);
	window.addEventListener("storage", storageChanged);
	return {
		get preference() {
			return preference;
		},
		getSnapshot: () => preference,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		refresh: update,
		set(value: LanguagePreference): boolean {
			preference = value;
			update();
			try {
				localStorage.setItem(key, value);
				return true;
			} catch {
				return false;
			}
		},
		destroy() {
			listeners.clear();
			window.removeEventListener("languagechange", update);
			window.removeEventListener("storage", storageChanged);
		},
	};
}
