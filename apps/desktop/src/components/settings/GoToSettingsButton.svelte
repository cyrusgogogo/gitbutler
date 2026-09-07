<script lang="ts">
	import { useSettingsModal } from "$lib/settings/settingsModal.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const { openGeneralSettings } = useSettingsModal();
</script>

<Button
	style="pop"
	icon="login"
	onclick={async () => {
		openGeneralSettings("general");
	}}
>
	{$i18nMessages.t("desktop:GoToSettingsButton.goToSettings")}
</Button>
