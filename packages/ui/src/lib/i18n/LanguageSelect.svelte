<script lang="ts">
	import { normalizePreference, type LanguagePreference } from "@gitbutler/i18n";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const {
		value,
		onchange,
		host = false,
	}: {
		value: LanguagePreference;
		onchange: (value: LanguagePreference) => Promise<boolean> | boolean;
		host?: boolean;
	} = $props();
	const translations = useTranslations();
	let saving = $state(false);
	let notice = $state<"error" | "session" | undefined>();
	async function change(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		saving = true;
		notice = undefined;
		try {
			if (!(await onchange(normalizePreference(select.value)))) notice = "session";
		} catch (error) {
			console.error(error);
			notice = "error";
			select.value = value;
		} finally {
			saving = false;
		}
	}
</script>

<div class="language-select">
	<label>
		<span>{$translations.t("common:language.label")}</span>
		<select {value} onchange={change} disabled={saving}>
			<option value="system"
				>{$translations.t(host ? "common:language.host" : "common:language.system")}</option
			>
			<option value="en">English</option>
			<option value="zh-CN">简体中文</option>
		</select>
	</label>
	{#if saving}<span role="status">{$translations.t("common:language.saving")}</span>{/if}
	{#if notice}<span role="status"
			>{$translations.t(
				notice === "error" ? "common:language.saveError" : "common:language.sessionOnly",
			)}</span
		>{/if}
</div>

<style>
	.language-select {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	label {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}
	select {
		min-width: 120px;
		padding: 4px 8px;
		border: 1px solid var(--border-1, #888);
		border-radius: 4px;
		background: var(--bg-1, transparent);
		color: inherit;
		font: inherit;
	}
</style>
