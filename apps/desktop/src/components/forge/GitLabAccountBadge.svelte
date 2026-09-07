<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Badge } from "@gitbutler/ui";
	import type { GitlabAccountIdentifier } from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

	type Props = {
		account: GitlabAccountIdentifier;
		class?: string;
	};

	const { account, class: className }: Props = $props();

	export function badgeText(account: GitlabAccountIdentifier): string | null {
		switch (account.type) {
			case "patUsername":
				return "PAT";
			case "selfHosted":
				return account.info.host;
		}
	}

	export function tooltipText(account: GitlabAccountIdentifier): string {
		switch (account.type) {
			case "patUsername":
				return $i18nMessages.t("desktop:GitLabAccountBadge.detail46e0a20e2");
			case "selfHosted":
				return $i18nMessages.t("desktop:GitLabAccountBadge.detail83c9ee69d");
		}
	}
</script>

<Badge class={className} tooltip={tooltipText(account)}>
	{badgeText(account)}
</Badge>
