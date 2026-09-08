<script lang="ts">
	import { goto } from "$app/navigation";
	import CliSymlinkSetup from "$components/settings/CliSymlinkSetup.svelte";

	import { BACKEND } from "$lib/backend";
	import { getUserErrorCode } from "$lib/backend/ipc";
	import { CLI_MANAGER } from "$lib/config/cli";
	import { LANGUAGE_SERVICE } from "$lib/i18n";
	import { showToast } from "$lib/notifications/toasts";
	import { PROJECTS_SERVICE } from "$lib/project/projectsService";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { TERMINAL_SERVICE } from "$lib/settings/terminalService";
	import {
		UI_STATE,
		type CodeEditorSettings,
		type TerminalSettings,
	} from "$lib/state/uiState.svelte";

	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, CardGroup, Modal, Select, SelectItem, Spacer, chipToasts } from "@gitbutler/ui";
	import LanguageSelect from "@gitbutler/ui/i18n/LanguageSelect.svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { onMount } from "svelte";

	const i18nMessages = useTranslations();

	const settingsService = inject(SETTINGS_SERVICE);
	const projectsService = inject(PROJECTS_SERVICE);

	const cliManager = inject(CLI_MANAGER);
	const [instalCLI, installingCLI] = cliManager.install;

	const backend = inject(BACKEND);
	const platformName = backend.platformName;

	const terminalService = inject(TERMINAL_SERVICE);

	const appSettings = settingsService.appSettings;
	const language = inject(LANGUAGE_SERVICE);

	let isDeleting = $state(false);

	let deleteConfirmationModal: ReturnType<typeof Modal> | undefined = $state();

	const uiState = inject(UI_STATE);
	const defaultCodeEditor = uiState.global.defaultCodeEditor;
	const defaultTerminal = uiState.global.defaultTerminal;

	const editorOptions: CodeEditorSettings[] = [
		{ schemeIdentifer: "vscodium", displayName: "VSCodium" },
		{ schemeIdentifer: "vscode", displayName: "VSCode" },
		{ schemeIdentifer: "vscode-insiders", displayName: "VSCode Insiders" },
		{ schemeIdentifer: "windsurf", displayName: "Windsurf" },
		{ schemeIdentifer: "zed", displayName: "Zed" },
		{ schemeIdentifer: "cursor", displayName: "Cursor" },
		{ schemeIdentifer: "trae", displayName: "Trae" },
		{ schemeIdentifer: "antigravity-ide", displayName: "Antigravity IDE" },
	];
	const editorOptionsForSelect = editorOptions.map((option) => ({
		label: option.displayName,
		value: option.schemeIdentifer,
	}));

	let terminalOptions: TerminalSettings[] = $state([]);
	let terminalOptionsForSelect: Array<{ label: string; value: string }> = $state([]);

	onMount(async () => {
		try {
			const options = await terminalService.getTerminalOptionsForPlatform(platformName);
			terminalOptions = options;
			terminalOptionsForSelect = options.map((option) => ({
				label: option.displayName,
				value: option.identifier,
			}));
		} catch (err) {
			console.error("Failed to load terminal options", err);
		}
	});

	async function onDeleteClicked() {
		isDeleting = true;
		try {
			await settingsService.deleteAllData();
			projectsService.unsetLastOpenedProject();

			chipToasts.success(i18nMessage("desktop:GeneralSettings.allDataDeleted"));
			goto("/", { replaceState: true, invalidateAll: true });
		} finally {
			deleteConfirmationModal?.close();
			isDeleting = false;
		}
	}

	let showSymlink = $state(false);
</script>

<LanguageSelect
	value={$appSettings?.ui.language ?? "system"}
	onchange={(value) => language.set(value)}
/>

<Spacer />

<CardGroup>
	<CardGroup.Item alignment="center">
		{#snippet title()}
			{$i18nMessages.t("desktop:GeneralSettings.defaultCodeEditor")}
		{/snippet}
		{#snippet actions()}
			<Select
				value={defaultCodeEditor.current.schemeIdentifer}
				options={editorOptionsForSelect}
				onselect={(value) => {
					const selected = editorOptions.find((option) => option.schemeIdentifer === value);
					if (selected) {
						defaultCodeEditor.set(selected);
					}
				}}
			>
				{#snippet itemSnippet({ item, highlighted })}
					<SelectItem
						selected={item.value === defaultCodeEditor.current.schemeIdentifer}
						{highlighted}
					>
						{item.label}
					</SelectItem>
				{/snippet}
			</Select>
		{/snippet}
	</CardGroup.Item>
	{#if platformName !== "web"}
		<CardGroup.Item alignment="center">
			{#snippet title()}
				{$i18nMessages.t("desktop:GeneralSettings.defaultTerminal")}
			{/snippet}
			{#snippet actions()}
				<Select
					value={defaultTerminal.current.identifier}
					options={terminalOptionsForSelect}
					onselect={(value) => {
						const selected = terminalOptions.find((option) => option.identifier === value);
						if (selected) {
							defaultTerminal.set(selected);
						}
					}}
				>
					{#snippet itemSnippet({ item, highlighted })}
						<SelectItem selected={item.value === defaultTerminal.current.identifier} {highlighted}>
							{item.label}
						</SelectItem>
					{/snippet}
				</Select>
			{/snippet}
		</CardGroup.Item>
	{/if}
</CardGroup>

<CardGroup>
	<CardGroup.Item>
		{#snippet title()}
			{#snippet i18nSlot1()}<code class="code-string">but</code>{/snippet}
			<I18nRichMessage
				value={{ key: "desktop:GeneralSettings.installTheGitButlerCLI" }}
				components={{ slot1: i18nSlot1 }}
			/>
		{/snippet}

		{#snippet caption()}
			{#if $appSettings?.ui.cliIsManagedByPackageManager}
				{#snippet i18nSlot2()}<code>but</code>{/snippet}
				<I18nRichMessage
					value={{ key: "desktop:GeneralSettings.theCLIIsManagedByYourPackageManager" }}
					components={{ slot2: i18nSlot2 }}
				/>
			{:else if platformName === "windows"}
				{#snippet i18nSlot3()}<code>`but`</code>{/snippet}
				<I18nRichMessage
					value={{ key: "desktop:GeneralSettings.onWindowsYouCanManuallyCopyTheExecutable" }}
					components={{ slot3: i18nSlot3 }}
				/>
			{:else}
				{#snippet i18nSlot4()}<code>`but`</code>{/snippet}
				<I18nRichMessage
					value={{ key: "desktop:GeneralSettings.installsTheGitButlerCLIInYourPATHAllowing" }}
					components={{ slot4: i18nSlot4 }}
				/>
			{/if}
		{/snippet}

		{#if !$appSettings?.ui.cliIsManagedByPackageManager}
			<div class="flex flex-col gap-16">
				<div class="flex gap-8 justify-end">
					{#if platformName !== "windows"}
						<Button
							style="pop"
							icon="play"
							onclick={async () => {
								try {
									await instalCLI();
								} catch (err: unknown) {
									// osascript returns a generic non-success when the
									// user dismisses the macOS admin-privileges prompt.
									// The backend tags that specific case with a
									// `CliInstallCancelled` code so we can show an info
									// toast instead of an error toast.
									if (getUserErrorCode(err) === "CliInstallCancelled") {
										showToast({
											style: "info",
											message: i18nMessage("desktop:GeneralSettings.inline7b374e272"),
										});
										return;
									}
									throw err;
								}
							}}
							loading={installingCLI.current.isLoading}
						>
							{$i18nMessages.t("desktop:GeneralSettings.installButCLI")}</Button
						>
					{/if}
					<Button
						style="gray"
						kind="outline"
						disabled={showSymlink}
						onclick={() => (showSymlink = !showSymlink)}
						>{$i18nMessages.t("desktop:GeneralSettings.showCommand")}</Button
					>
				</div>
			</div>

			{#if showSymlink}
				<CliSymlinkSetup class="m-t-14" />
			{/if}
		{/if}
	</CardGroup.Item>
</CardGroup>

<Spacer />

<CardGroup>
	<CardGroup.Item>
		{#snippet title()}
			{$i18nMessages.t("desktop:GeneralSettings.removeAllProjects")}
		{/snippet}
		{#snippet caption()}
			{#snippet i18nSlot5()}<br />{/snippet}
			<I18nRichMessage
				value={{ key: "desktop:GeneralSettings.youCanDeleteAllProjectsFromTheGitButler" }}
				components={{ slot5: i18nSlot5 }}
			/>
		{/snippet}

		{#snippet actions()}
			<Button style="danger" kind="outline" onclick={() => deleteConfirmationModal?.show()}>
				{$i18nMessages.t("desktop:GeneralSettings.removeProjects")}
			</Button>
		{/snippet}
	</CardGroup.Item>
</CardGroup>

<Modal
	bind:this={deleteConfirmationModal}
	width="small"
	title={$i18nMessages.t("desktop:GeneralSettings.removeAllProjects")}
	onSubmit={onDeleteClicked}
>
	<p>{$i18nMessages.t("desktop:GeneralSettings.areYouSureYouWantToRemoveAll")}</p>

	{#snippet controls(close)}
		<Button style="danger" kind="outline" loading={isDeleting} type="submit"
			>{$i18nMessages.t("desktop:GeneralSettings.remove")}</Button
		>
		<Button style="pop" onclick={close}>{$i18nMessages.t("desktop:GeneralSettings.cancel")}</Button>
	{/snippet}
</Modal>

<style lang="postcss">
</style>
