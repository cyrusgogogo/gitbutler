import "@testing-library/jest-dom/vitest";
import { createI18n } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/desktop";
import { setFallbackI18n } from "@gitbutler/i18n/svelte";

setFallbackI18n(createI18n(resources, "en"));

// https://github.com/testing-library/svelte-testing-library/issues/284#issuecomment-2082726160
Element.prototype.animate = () => ({
	// @ts-expect-error `Animation` execpted
	finished: Promise.resolve(),
	cancel: () => {},
	finish: () => {},
});
