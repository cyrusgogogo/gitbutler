<script lang="ts">
	import AnalyticsSettings from "$components/shared/AnalyticsSettings.svelte";
	import { initAnalyticsIfEnabled } from "$lib/analytics/analytics";
	import { LANGUAGE_SERVICE } from "$lib/i18n";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { OnboardingEvent, POSTHOG_WRAPPER } from "$lib/telemetry/posthog";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { AsyncButton, TestId } from "@gitbutler/ui";
	import LanguageSelect from "@gitbutler/ui/i18n/LanguageSelect.svelte";
	const i18nMessages = useTranslations();

	const settingsService = inject(SETTINGS_SERVICE);
	const language = inject(LANGUAGE_SERVICE);
	const appSettings = $derived(settingsService.appSettings);
	const posthog = inject(POSTHOG_WRAPPER);
</script>

<div class="analytics-confirmation">
	<h1 class="title text-serif-42">
		{$i18nMessages.t("desktop:AnalyticsConfirmation.beforeWeBegin")}
	</h1>
	<LanguageSelect
		value={$appSettings?.ui.language ?? "system"}
		onchange={(value) => language.set(value)}
	/>
	<AnalyticsSettings />

	{#if $appSettings !== undefined}
		<div class="analytics-confirmation__actions">
			<AsyncButton
				style="pop"
				testId={TestId.OnboardingPageAnalyticsSettingsContinueButton}
				icon="chevron-right"
				action={async () => {
					await settingsService.updateOnboardingComplete(true);
					initAnalyticsIfEnabled($appSettings, posthog, true).then(() => {
						// Await the initialization before logging the event to ensure PostHog is ready
						posthog.captureOnboarding(OnboardingEvent.ConfirmedAnalytics);
					});
				}}
			>
				{$i18nMessages.t("desktop:AnalyticsConfirmation.continue")}
			</AsyncButton>
		</div>
	{/if}
</div>

<style lang="postcss">
	.analytics-confirmation {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 12px;
	}

	.title {
		color: var(--text-1);
	}

	.analytics-confirmation__actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
