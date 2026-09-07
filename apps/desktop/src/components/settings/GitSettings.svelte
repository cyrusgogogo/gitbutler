<script lang="ts">
	import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Link, Select, SelectItem, Toggle } from "@gitbutler/ui";
	import { onMount } from "svelte";
	const i18nMessages = useTranslations();

	const gitConfig = inject(GIT_CONFIG_SERVICE);
	const settingsService = inject(SETTINGS_SERVICE);
	const settings = settingsService.appSettings;

	let annotateCommits = $state(true);
	let fetchFrequency = $state<number>(-1);

	const fetchFrequencyOptions = $derived([
		{ label: $i18nMessages.t("desktop:GitSettings.static62957ecfd"), value: "1", minutes: 1 },
		{ label: $i18nMessages.t("desktop:GitSettings.static3aa5819ed"), value: "5", minutes: 5 },
		{ label: $i18nMessages.t("desktop:GitSettings.statica6f151883"), value: "10", minutes: 10 },
		{ label: $i18nMessages.t("desktop:GitSettings.static899761ff5"), value: "15", minutes: 15 },
		{ label: $i18nMessages.t("desktop:GitSettings.static6eef66484"), value: "none", minutes: -1 },
	] as const);

	function toggleCommitterSigning() {
		annotateCommits = !annotateCommits;
		gitConfig.set("gitbutler.gitbutlerCommitter", annotateCommits ? "1" : "0");
	}

	async function updateFetchFrequency(value: string) {
		const option = fetchFrequencyOptions.find((opt) => opt.value === value);
		if (option) {
			fetchFrequency = option.minutes;
			await settingsService.updateFetch({ autoFetchIntervalMinutes: option.minutes });
		}
	}

	const selectedValue = $derived(
		fetchFrequencyOptions.find((opt) => opt.minutes === fetchFrequency)?.value ?? "none",
	);

	onMount(async () => {
		annotateCommits = (await gitConfig.get("gitbutler.gitbutlerCommitter")) === "1";
	});

	$effect(() => {
		if ($settings?.fetch) {
			fetchFrequency = $settings.fetch.autoFetchIntervalMinutes;
		}
	});
</script>

<CardGroup.Item standalone labelFor="committerSigning">
	{#snippet title()}
		{$i18nMessages.t("desktop:GitSettings.creditGitButlerAsTheCommitter")}
	{/snippet}
	{#snippet caption()}
		{$i18nMessages.t("desktop:GitSettings.byDefaultEverythingInTheGitButlerClientIs")}
		<Link
			href="https://github.com/gitbutlerapp/gitbutler-docs/blob/d81a23779302c55f8b20c75bf7842082815b4702/content/docs/features/virtual-branches/committer-mark.mdx"
		>
			{$i18nMessages.t("desktop:GitSettings.learnMore")}
		</Link>
	{/snippet}
	{#snippet actions()}
		<Toggle id="committerSigning" checked={annotateCommits} onclick={toggleCommitterSigning} />
	{/snippet}
</CardGroup.Item>

<CardGroup.Item standalone labelFor="fetchFrequency" alignment="center">
	{#snippet title()}
		{$i18nMessages.t("desktop:GitSettings.autoFetchFrequency")}
	{/snippet}
	{#snippet actions()}
		<Select
			id="fetchFrequency"
			options={fetchFrequencyOptions}
			value={selectedValue}
			onselect={updateFetchFrequency}
		>
			{#snippet itemSnippet({ item, highlighted })}
				<SelectItem selected={item.value === selectedValue} {highlighted}>
					{item.label}
				</SelectItem>
			{/snippet}
		</Select>
	{/snippet}
</CardGroup.Item>
