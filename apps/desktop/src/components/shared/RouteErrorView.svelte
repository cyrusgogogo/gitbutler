<script lang="ts">
	import IllustrationSplitLayout from "$components/shared/IllustrationSplitLayout.svelte";
	import ProjectSwitcher from "$components/shared/ProjectSwitcher.svelte";
	import loadErrorSvg from "$lib/assets/illustrations/load-error.svg?raw";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { InfoMessage } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	interface Props {
		projectId?: string;
		error?: any;
	}

	const { projectId, error = undefined }: Props = $props();
</script>

<IllustrationSplitLayout img={loadErrorSvg}>
	<div class="problem__container">
		<h2 class="problem__title text-18 text-body text-bold">
			{$i18nMessages.t("desktop:RouteErrorView.thereWasAProblemLoadingTheApp")}
		</h2>

		<InfoMessage filled outlined={false} style="danger" icon="info">
			{#snippet content()}
				{error ? error : $i18nMessages.t("desktop:RouteErrorView.anUnknownErrorOccurred")}
			{/snippet}
		</InfoMessage>

		<ProjectSwitcher {projectId} />
	</div>
</IllustrationSplitLayout>

<style lang="postcss">
	.problem__container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.problem__title {
		color: var(--text-1);
	}
</style>
