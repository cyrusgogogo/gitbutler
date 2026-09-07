<script lang="ts">
	import Badge from "$components/Badge.svelte";
	import Tooltip from "$components/Tooltip.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const i18nMessages = useTranslations();
</script>

<Tooltip text={$i18nMessages.t("ui:ExecutableLabel.executable")}>
	<Badge kind="soft" style="gray" size="icon">{$i18nMessages.t("ui:ExecutableLabel.ex")}</Badge>
</Tooltip>
