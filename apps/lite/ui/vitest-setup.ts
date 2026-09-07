import { createI18n } from "@gitbutler/i18n";
import { setFallbackI18n } from "@gitbutler/i18n/react";
import { resources } from "@gitbutler/i18n/catalogs/lite";

setFallbackI18n(createI18n(resources, "en"));
