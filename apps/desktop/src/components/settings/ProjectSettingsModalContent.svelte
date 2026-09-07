<script lang="ts">
	import CloudForm from "$components/projectSettings/CloudForm.svelte";
	import GeneralSettings from "$components/projectSettings/GeneralSettings.svelte";
	import GitForm from "$components/projectSettings/GitForm.svelte";
	import PreferencesForm from "$components/projectSettings/PreferencesForm.svelte";
	import SettingsModalLayout from "$components/settings/SettingsModalLayout.svelte";
	import { projectSettingsPages } from "$lib/settings/projectSettingsPages";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { ProjectSettingsModalState, ProjectSettingsPageId } from "$lib/state/uiState.svelte";
	const i18nMessages = useTranslations();

	type Props = {
		data: ProjectSettingsModalState;
	};

	const { data }: Props = $props();

	const pages = projectSettingsPages;

	let currentSelectedId = $derived(data.selectedId || pages.at(0)?.id);

	function selectPage(pageId: ProjectSettingsPageId) {
		currentSelectedId = pageId;
	}
</script>

<SettingsModalLayout
	title={$i18nMessages.t("desktop:ProjectSettingsModalContent.projectSettings")}
	{pages}
	selectedId={currentSelectedId}
	onSelectPage={selectPage}
>
	{#snippet content({ currentPage })}
		{#if currentPage}
			{#if currentPage.id === "project"}
				<GeneralSettings projectId={data.projectId} />
			{:else if currentPage.id === "git"}
				<GitForm projectId={data.projectId} />
			{:else if currentPage.id === "ai"}
				<CloudForm projectId={data.projectId} />
			{:else if currentPage.id === "experimental"}
				<PreferencesForm projectId={data.projectId} />
			{:else}
				{$i18nMessages.t("desktop:ProjectSettingsModalContent.settingsPageValueNotFound", {
					id: String(currentPage.id),
				})}
			{/if}
		{:else}
			{$i18nMessages.t("desktop:ProjectSettingsModalContent.settingsPageValueNotFound_c1734c7", {
				currentSelectedId: String(currentSelectedId),
			})}
		{/if}
	{/snippet}
</SettingsModalLayout>
