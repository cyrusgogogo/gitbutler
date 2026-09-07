import { createI18n } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/ui";
import { setFallbackI18n } from "@gitbutler/i18n/svelte";

setFallbackI18n(createI18n(resources, "en"));
