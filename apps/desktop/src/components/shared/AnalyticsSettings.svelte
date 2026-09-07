<script lang="ts">
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Link, TestId, Toggle } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const settingsService = inject(SETTINGS_SERVICE);
	const appSettings = $derived(settingsService.appSettings);
	const errorReportingEnabled = $derived($appSettings?.telemetry.appErrorReportingEnabled);
	const metricsEnabled = $derived($appSettings?.telemetry.appMetricsEnabled);
</script>

<div class="analytics-settings__content">
	<p class="text-13 text-body analytics-settings__text">
		{$i18nMessages.t("desktop:AnalyticsSettings.gitButlerUsesTelemetryStrictlyToHelpUsImprove")}
		<Link href="https://gitbutler.com/privacy">
			{$i18nMessages.t("desktop:AnalyticsSettings.privacyPolicy")}
		</Link>
	</p>
	<p class="text-13 text-body analytics-settings__text">
		{$i18nMessages.t("desktop:AnalyticsSettings.weKindlyAskYouToConsiderKeepingThese")}
		<Link href="https://discord.gg/MmFkmaJ42D">Discord</Link>.
	</p>
</div>

<CardGroup testId={TestId.OnboardingPageAnalyticsSettings}>
	<CardGroup.Item labelFor="errorReportingToggle">
		{#snippet title()}
			{$i18nMessages.t("desktop:AnalyticsSettings.errorReporting")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AnalyticsSettings.toggleReportingOfApplicationCrashesAndErrors")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="errorReportingToggle"
				testId={TestId.OnboardingPageAnalyticsSettingsErrorReportingToggle}
				checked={errorReportingEnabled}
				onclick={() =>
					settingsService.updateTelemetry({
						appErrorReportingEnabled: !errorReportingEnabled,
					})}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="metricsEnabledToggle">
		{#snippet title()}
			{$i18nMessages.t("desktop:AnalyticsSettings.usageMetrics")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("desktop:AnalyticsSettings.toggleSharingOfUsageStatistics")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="metricsEnabledToggle"
				testId={TestId.OnboardingPageAnalyticsSettingsTelemetryToggle}
				checked={metricsEnabled}
				onclick={() =>
					settingsService.updateTelemetry({
						appMetricsEnabled: !metricsEnabled,
					})}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>

<style lang="postcss">
	.analytics-settings__content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.analytics-settings__text {
		margin-bottom: 10px;
		color: var(--text-2);
	}
</style>
