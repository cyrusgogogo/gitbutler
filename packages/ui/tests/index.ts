// Import styles needed for components
import "@gitbutler/design-core/utility";
import "@gitbutler/design-core/core";
import "../src/styles/main.css";
import { createI18n } from "@gitbutler/i18n";
import { resources } from "@gitbutler/i18n/catalogs/ui";
import { setFallbackI18n } from "@gitbutler/i18n/svelte";

setFallbackI18n(createI18n(resources, "en"));
