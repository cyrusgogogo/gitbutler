<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { ContextMenuItem, ContextMenuSection, KebabButton, TestId } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	type Props = {
		onCherryPick: () => void;
		rightClickTrigger: HTMLElement;
	};

	const { onCherryPick: onclick, rightClickTrigger }: Props = $props();
</script>

<KebabButton showOnHover contextElement={rightClickTrigger} testId={TestId.KebabMenuButton}>
	{#snippet contextMenu({ close })}
		<ContextMenuSection>
			<ContextMenuItem
				label={$i18nMessages.t("desktop:BranchesViewCommitContextMenu.cherryPickCommit")}
				icon="cherry-pick"
				onclick={() => {
					close();
					onclick();
				}}
			/>
		</ContextMenuSection>
	{/snippet}
</KebabButton>
