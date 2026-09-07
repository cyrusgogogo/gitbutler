<script lang="ts">
	import { ORGANIZATION_SERVICE } from "$lib/organizations/organizationService";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, Modal, Textarea, Textbox } from "@gitbutler/ui";
	import { slugify } from "@gitbutler/ui/utils/string";
	const i18nMessages = useTranslations();

	const organizationService = inject(ORGANIZATION_SERVICE);

	let name = $state<string>("");
	let slug = $state<string>("");
	const sluggifiedSlug = $derived(slugify(slug || name || "").toLocaleLowerCase());
	let description = $state<string>("");

	const requiredFieldsFilled = $derived(!!(name && sluggifiedSlug));
	let modalCreationState: "inert" | "loading" | "complete" = $state("inert");
	let submitAttempted = $state(false);

	function onModalClose() {
		name = "";
		slug = "";
		description = "";
		modalCreationState = "inert";
		submitAttempted = false;
	}

	async function create(close: () => void) {
		submitAttempted = true;

		if (!requiredFieldsFilled) return;

		modalCreationState = "loading";
		await organizationService.createOrganization(sluggifiedSlug, name, description);
		modalCreationState = "complete";
		close();
	}

	let modal = $state<Modal>();

	export function show() {
		modal?.show();
	}
</script>

<Modal bind:this={modal} onClose={onModalClose}>
	<div class="form-container">
		<h2>{$i18nMessages.t("shared:CreateOrganizationModal.createANewOrganization")}</h2>
		<p>
			{$i18nMessages.t("shared:CreateOrganizationModal.organizationsAreAWayToGroupProjectsAnd")}
		</p>
		<Textbox
			bind:value={name}
			label={$i18nMessages.t("shared:CreateOrganizationModal.name")}
			required={submitAttempted}
		></Textbox>
		<Textbox
			bind:value={slug}
			label={$i18nMessages.t("shared:CreateOrganizationModal.slug")}
			required={submitAttempted}
		></Textbox>
		{#if slug !== sluggifiedSlug}
			<p>
				{$i18nMessages.t("shared:CreateOrganizationModal.slugWillBeSaveAsValue", {
					sluggifiedSlug: String(sluggifiedSlug),
				})}
			</p>
		{/if}

		<Textarea
			bind:value={description}
			label={$i18nMessages.t("shared:CreateOrganizationModal.description")}
		></Textarea>
	</div>

	{#snippet controls(close)}
		<Button
			disabled={!requiredFieldsFilled}
			loading={modalCreationState === "loading"}
			onclick={() => create(close)}
			>{$i18nMessages.t("shared:CreateOrganizationModal.create")}</Button
		>
	{/snippet}
</Modal>

<style>
	h2 {
		margin-bottom: 10px;
		font-weight: 600;
		font-size: 20px;
	}

	.form-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
