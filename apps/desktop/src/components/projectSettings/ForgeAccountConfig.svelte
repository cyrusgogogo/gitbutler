<script lang="ts" generics="TAccount">
	import { useSettingsModal } from "$lib/settings/settingsModal.svelte";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, CardGroup, Link, Select, SelectItem } from "@gitbutler/ui";
	import type { Component, Snippet } from "svelte";
	const i18nMessages = useTranslations();

	type Props = {
		projectId: string;
		displayName: string;
		accounts: TAccount[];
		preferredAccount: TAccount | undefined;
		accountToString: (account: TAccount) => string;
		stringToAccount: (value: string) => TAccount | null;
		getUsername: (account: TAccount) => string;
		updatePreferredAccount: (projectId: string, account: TAccount) => void;
		AccountBadge: Component<{ account: TAccount; class?: string }>;
		docsUrl: string;
		requestType: "pull request" | "merge request";
		/** Degraded-integration notice rendered below the account select. */
		notice?: Snippet;
	};

	const {
		projectId,
		displayName,
		accounts,
		preferredAccount,
		accountToString,
		stringToAccount,
		getUsername,
		updatePreferredAccount,
		AccountBadge,
		docsUrl,
		requestType,
		notice,
	}: Props = $props();

	const { openGeneralSettings } = useSettingsModal();
	const hasAccounts = $derived(accounts.length > 0 && preferredAccount);

	function handleAccountChange(value: string) {
		const parsedAccount = stringToAccount(value);
		if (!parsedAccount) return;
		updatePreferredAccount(projectId, parsedAccount);
	}
</script>

<CardGroup.Item>
	{#snippet title()}
		{#if hasAccounts}
			{$i18nMessages.t("desktop:ForgeAccountConfig.configureValueIntegration", {
				displayName: String(displayName),
			})}
		{:else}
			{$i18nMessages.t("desktop:ForgeAccountConfig.connectYourValueAccount", {
				displayName: String(displayName),
			})}
		{/if}
	{/snippet}

	{#snippet caption()}
		{$i18nMessages.t("desktop:ForgeAccountConfig.enableValueCreationReadMoreInThe", {
			requestType: String(requestType),
		})}
		<Link href={docsUrl}>{$i18nMessages.t("desktop:ForgeAccountConfig.docs")}</Link>
	{/snippet}

	{#if !hasAccounts}
		<div class="flex">
			<Button onclick={() => openGeneralSettings("integrations")} style="pop" icon="link"
				>{$i18nMessages.t("desktop:ForgeAccountConfig.setUpInGeneralSettings")}</Button
			>
		</div>
	{:else}
		{@const account = preferredAccount!}
		{@const accountStr = accountToString(account)}
		<Select
			label={$i18nMessages.t("desktop:ForgeAccountConfig.valueAccountForThisProject", {
				displayName: String(displayName),
			})}
			value={accountStr}
			options={accounts.map((acc) => ({
				label: getUsername(acc),
				value: accountToString(acc),
			}))}
			onselect={handleAccountChange}
			disabled={accounts.length <= 1}
			wide
		>
			{#snippet itemSnippet({ item, highlighted })}
				{@const itemAccount = item.value && stringToAccount(item.value)}
				<SelectItem selected={item.value === accountStr} {highlighted}>
					{item.label}

					{#if itemAccount}
						<AccountBadge account={itemAccount} class="m-l-4" />
					{/if}
				</SelectItem>
			{/snippet}
		</Select>
	{/if}

	{#if notice}
		{@render notice()}
	{/if}
</CardGroup.Item>
