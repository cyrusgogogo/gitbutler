<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const i18nMessages = useTranslations();

	// This is a stub for an actually useful LoadingState component
</script>

<p>{$i18nMessages.t("shared:LoadingState.loading")}</p>
