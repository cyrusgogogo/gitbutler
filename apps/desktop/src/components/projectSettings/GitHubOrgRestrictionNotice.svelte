<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { InfoMessage, Link } from "@gitbutler/ui";
	import type { Code } from "@gitbutler/but-sdk";
	const i18nMessages = useTranslations();

	const { errorCode }: { errorCode: Code | undefined } = $props();
</script>

{#if errorCode === "GitHubOrgOAuthRestricted"}
	<InfoMessage style="warning" filled outlined={false}>
		{#snippet title()}
			{$i18nMessages.t("desktop:GitHubOrgRestrictionNotice.restrictedByAGitHubOrganization")}
		{/snippet}
		{#snippet content()}
			{$i18nMessages.t(
				"desktop:GitHubOrgRestrictionNotice.anOrganizationThatOwnsThisRepositoryHasBlocked",
			)}
			<Link
				href="https://docs.gitbutler.com/features/forge-integration/github-integration?utm_source=gitbutler-app&utm_medium=settings-banner&utm_campaign=org-oauth-restriction#connect-a-github-account"
				>{$i18nMessages.t("desktop:GitHubOrgRestrictionNotice.docs")}</Link
			>.
		{/snippet}
	</InfoMessage>
{:else if errorCode === "GitHubOrgSamlRestricted"}
	<InfoMessage style="warning" filled outlined={false}>
		{#snippet title()}
			{$i18nMessages.t("desktop:GitHubOrgRestrictionNotice.gitHubOrganizationRequiresSAMLSSO")}
		{/snippet}
		{#snippet content()}
			{$i18nMessages.t(
				"desktop:GitHubOrgRestrictionNotice.thisRepositorySOrganizationRequiresSAMLSSOBut",
			)}
		{/snippet}
	</InfoMessage>
{/if}
