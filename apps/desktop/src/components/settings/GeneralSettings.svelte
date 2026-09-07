<script lang="ts">
	import { goto } from "$app/navigation";
	import CliSymlinkSetup from "$components/settings/CliSymlinkSetup.svelte";
	import AccessTokenSignIn from "$components/shared/AccessTokenSignIn.svelte";
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
	import { UPDATER_SERVICE } from "$lib/updater/updater";
	import { USER_SERVICE } from "$lib/user/userService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { message as i18nMessage } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		Button,
		CardGroup,
		Modal,
		ProfilePictureUpload,
		Select,
		SelectItem,
		Spacer,
		Textbox,
		Toggle,
		chipToasts,
	} from "@gitbutler/ui";
	import LanguageSelect from "@gitbutler/ui/i18n/LanguageSelect.svelte";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { onMount } from "svelte";
	import type { User } from "$lib/user/user";
	const i18nMessages = useTranslations();

	const userService = inject(USER_SERVICE);
	const settingsService = inject(SETTINGS_SERVICE);
	const projectsService = inject(PROJECTS_SERVICE);

	const updaterService = inject(UPDATER_SERVICE);
	const disableAutoChecks = updaterService.disableAutoChecks;

	const cliManager = inject(CLI_MANAGER);
	const [instalCLI, installingCLI] = cliManager.install;

	const backend = inject(BACKEND);
	const platformName = backend.platformName;

	const terminalService = inject(TERMINAL_SERVICE);

	const appSettings = settingsService.appSettings;
	const language = inject(LANGUAGE_SERVICE);

	let saving = $state(false);
	let newName = $state("");
	let isDeleting = $state(false);
	let loaded = $state(false);

	let userPicture = $state(userService.user?.picture);

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

	$effect(() => {
		if (userService.user && !loaded) {
			loaded = true;
			userService.getUser().then((cloudUser) => {
				const userData: User = {
					...cloudUser,
					name: cloudUser.name || undefined,
					email: cloudUser.email || undefined,
					login: cloudUser.login || undefined,
					picture: cloudUser.picture || "#",
					locale: cloudUser.locale || "en",
					access_token: cloudUser.access_token || "impossible-situation",
					role: cloudUser.role || "user",
					supporter: cloudUser.supporter || false,
				};
				userPicture = userData.picture;
				userService.setUser(userData);
			});
			newName = userService.user?.name || "";
		}
	});

	let selectedPictureFile: File | undefined = $state();

	async function onSubmit(e: SubmitEvent) {
		if (!userService.user) return;
		saving = true;

		e.preventDefault();

		try {
			const updatedUser = await userService.updateUser({
				name: newName,
				picture: selectedPictureFile,
			});
			userService.setUser(updatedUser);
			chipToasts.success(i18nMessage("desktop:GeneralSettings.profileUpdated"));
			selectedPictureFile = undefined;
		} finally {
			saving = false;
		}
	}

	function onPictureChange(file: File) {
		selectedPictureFile = file;
		userPicture = URL.createObjectURL(file);
	}

	async function onDeleteClicked() {
		isDeleting = true;
		try {
			await settingsService.deleteAllData();
			projectsService.unsetLastOpenedProject();
			await userService.forgetUserCredentials();
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

{#if userService.user}
	<CardGroup>
		<form onsubmit={onSubmit} class="profile-form">
			<ProfilePictureUpload
				bind:picture={userPicture}
				onFileSelect={onPictureChange}
				onInvalidFileType={() =>
					chipToasts.error(i18nMessage("desktop:GeneralSettings.inlinec6a2a3810"))}
			/>

			<div id="contact-info" class="contact-info">
				<div class="contact-info__fields">
					<Textbox
						label={$i18nMessages.t("desktop:GeneralSettings.fullName")}
						bind:value={newName}
						required
					/>
					<Textbox
						label={$i18nMessages.t("desktop:GeneralSettings.email")}
						value={userService.user?.email}
						readonly
					/>
				</div>

				<Button type="submit" style="pop" loading={saving}
					>{$i18nMessages.t("desktop:GeneralSettings.updateProfile")}</Button
				>
			</div>
		</form>
	</CardGroup>

	<CardGroup>
		<CardGroup.Item>
			{#snippet title()}
				{$i18nMessages.t("desktop:GeneralSettings.forgetCredentialsAndLogOut")}
			{/snippet}
			{#snippet caption()}
				{$i18nMessages.t("desktop:GeneralSettings.clickHereToClearYourCredentialsAndUnwind")}
			{/snippet}
			{#snippet actions()}
				<Button
					kind="outline"
					icon="logout"
					onclick={async () => {
						await userService.forgetUserCredentials();
					}}>{$i18nMessages.t("desktop:GeneralSettings.forgetCredentials")}</Button
				>
			{/snippet}
		</CardGroup.Item>
	</CardGroup>
{/if}

<AccessTokenSignIn />

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
	<CardGroup.Item labelFor="disable-auto-checks">
		{#snippet title()}
			{$i18nMessages.t("desktop:GeneralSettings.automaticallyCheckForUpdates")}
		{/snippet}

		{#snippet caption()}
			{$i18nMessages.t("desktop:GeneralSettings.automaticallyCheckForUpdatesYouCanStillCheck")}
		{/snippet}

		{#snippet actions()}
			<Toggle
				id="disable-auto-checks"
				checked={!$disableAutoChecks}
				onclick={() => ($disableAutoChecks = !$disableAutoChecks)}
			/>
		{/snippet}
	</CardGroup.Item>
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
	.profile-form {
		display: flex;
		padding: 16px;
		gap: 24px;
	}

	.contact-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: flex-end;
		gap: 20px;
	}

	.contact-info__fields {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 12px;
	}
</style>
