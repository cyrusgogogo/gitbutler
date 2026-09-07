<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Badge } from "@gitbutler/ui";
	import type { BitbucketAccountIdentifier } from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

	type Props = {
		account: BitbucketAccountIdentifier;
		class?: string;
	};

	const { account, class: className }: Props = $props();

	export function badgeText(account: BitbucketAccountIdentifier): string | null {
		switch (account.type) {
			case "apiToken":
				return $i18nMessages.t("desktop:BitbucketAccountBadge.detailbc020b983");
		}
	}

	export function tooltipText(account: BitbucketAccountIdentifier): string {
		switch (account.type) {
			case "apiToken":
				return $i18nMessages.t("desktop:BitbucketAccountBadge.detailcefe261db");
		}
	}
</script>

<Badge class={className} tooltip={tooltipText(account)}>
	{badgeText(account)}
</Badge>
