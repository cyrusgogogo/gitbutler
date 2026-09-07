<script lang="ts">
	import { splitMessage } from "$lib/commits/commitMessage";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { TestId, Tooltip } from "@gitbutler/ui";
	const i18nMessages = useTranslations();

	type Props = {
		truncate?: boolean;
		commitMessage: string;
		className?: string;
		editable?: boolean;
	};

	const { commitMessage, truncate, className, editable }: Props = $props();

	const title = $derived(splitMessage(commitMessage).title);

	function getTitle() {
		if (title) {
			return title;
		}
		return editable
			? $i18nMessages.t("desktop:CommitTitle.detail70dc2de16")
			: $i18nMessages.t("desktop:CommitTitle.detail81186b7ed");
	}
</script>

<Tooltip text={getTitle()} delay={1200}>
	<h3
		data-testid={TestId.CommitDrawerTitle}
		class="{className} commit-title"
		class:truncate
		class:clr-text-3={!title}
	>
		{getTitle()}
	</h3>
</Tooltip>
