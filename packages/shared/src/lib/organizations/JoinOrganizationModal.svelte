<script lang="ts">
	import { ORGANIZATION_SERVICE } from "$lib/organizations/organizationService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal, Textbox } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	const organizationService = inject(ORGANIZATION_SERVICE);

	let modal = $state<Modal>();

	let organizationSlug = $state("");
	let joinCode = $state("");
	let joiningState = $state<"intert" | "loading" | "completed">("intert");
	const buttonEnabled = $derived(!!(joinCode && organizationSlug));

	async function join(close: () => void) {
		joiningState = "loading";

		await organizationService.joinOrganization(organizationSlug, joinCode);

		joiningState = "completed";
		close();
	}

	export function show() {
		modal?.show();
	}
</script>

<Modal
	bind:this={modal}
	title={$i18nMessages.t("shared:JoinOrganizationModal.joinAnOrganization")}
	width="small"
>
	<p>{$i18nMessages.t("shared:JoinOrganizationModal.toJoinAnOrganizationYouNeedToHave")}</p>
	<br />
	<Textbox
		bind:value={organizationSlug}
		label={$i18nMessages.t("shared:JoinOrganizationModal.organizationSlug")}
	/>
	<br />
	<Textbox bind:value={joinCode} label={$i18nMessages.t("shared:JoinOrganizationModal.joinCode")} />

	{#snippet controls(close)}
		<Button
			disabled={!buttonEnabled}
			loading={joiningState === "loading"}
			onclick={() => join(close)}>{$i18nMessages.t("shared:JoinOrganizationModal.join")}</Button
		>
	{/snippet}
</Modal>
