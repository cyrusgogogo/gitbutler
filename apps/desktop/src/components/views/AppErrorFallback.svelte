<script lang="ts">
	import { goto } from "$app/navigation";
	import ProjectNotFound from "$components/onboarding/ProjectNotFound.svelte";
	import IllustrationSplitLayout from "$components/shared/IllustrationSplitLayout.svelte";
	import loadErrorSvg from "$lib/assets/illustrations/load-error.svg?raw";
	import { parseQueryError } from "$lib/error/error";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, InfoMessage } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		error: unknown;
	};

	const { projectId, error }: Props = $props();

	const parsedError = $derived(parseQueryError(error));

	function isMonday() {
		const today = new Date();
		return today.getDay() === 1;
	}

	function apologiy(): string {
		if (isMonday()) {
			return $i18nMessages.t("desktop:AppErrorFallback.detaila7a599712");
		}
		return $i18nMessages.t("desktop:AppErrorFallback.detail44331ca18");
	}
</script>

{#if parsedError.code === "ProjectMissing"}
	<ProjectNotFound {projectId} />
{:else}
	<IllustrationSplitLayout img={loadErrorSvg}>
		<div class="container">
			<div class="text-content">
				<h2 class="title-text text-18 text-body text-bold">
					{$i18nMessages.t("desktop:AppErrorFallback.somethingWentWrong")}
				</h2>

				<p class="description-text text-13 text-body">
					{apologiy()}
				</p>
			</div>

			<InfoMessage error={parsedError.message} style="danger">
				{#snippet title()}
					{parsedError.name}
				{/snippet}
				{#snippet content()}
					{$i18nMessages.t("desktop:AppErrorFallback.anAsynchronousOperationFailed")}
				{/snippet}
			</InfoMessage>

			<div class="button-container">
				<Button type="button" style="pop" onclick={async () => await goto("/")}
					>{$i18nMessages.t("desktop:AppErrorFallback.goBack")}</Button
				>
			</div>
		</div>
	</IllustrationSplitLayout>
{/if}

<style lang="postcss">
	.container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.text-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.title-text {
		color: var(--text-1);
	}

	.button-container {
		display: flex;
		justify-content: end;
		gap: 8px;
	}

	.description-text {
		color: var(--text-2);
		line-height: 1.6;
	}
</style>
