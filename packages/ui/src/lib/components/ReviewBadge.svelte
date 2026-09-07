<script lang="ts">
	import Badge from "$components/Badge.svelte";
	import { getForgeLogo } from "$lib/utils/getForgeLogo";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const i18nMessages = useTranslations();

	interface Props {
		type: string | undefined;
		forge?: string;
		status?: "open" | "closed" | "draft" | "merged" | "unknown";
		number: number;
		title?: string;
		testId?: string;
	}

	const { type, forge, status, number, title, testId }: Props = $props();

	const reviewUnit = $derived(type === "MR" ? "MR" : "PR");
	const reviewSymbol = $derived(reviewUnit === "MR" ? "!" : "#");

	// Prefer the forge-specific logo; fall back to inferring from the review unit
	// for callers that don't pass a forge name.
	const icon = $derived(
		forge ? getForgeLogo(forge) : type === "MR" ? "gitlab" : type === "PR" ? "github" : undefined,
	);
	const id = $derived(`${reviewSymbol}${number}`);

	function getBadgeStyle(status: Props["status"]): "safe" | "danger" | "purple" | "gray" {
		switch (status) {
			case "open":
				return "safe";
			case "closed":
				return "danger";
			case "merged":
				return "purple";
			default:
				return "gray";
		}
	}

	const badgeDetails = $derived.by(() => {
		if (title) {
			return title;
		}

		switch (status) {
			case "open":
				return $i18nMessages.t("ui:ReviewBadge.detaileea3ce0b6", {
					value1: String(reviewUnit),
					value2: String(id),
				});
			case "closed":
				return $i18nMessages.t("ui:ReviewBadge.detail1f98403c1", {
					value1: String(reviewUnit),
					value2: String(id),
				});
			case "draft":
				return $i18nMessages.t("ui:ReviewBadge.detail2ac4cc049", {
					value1: String(reviewUnit),
					value2: String(id),
				});
			case "merged":
				return $i18nMessages.t("ui:ReviewBadge.detail3dc2cc5db", {
					value1: String(reviewUnit),
					value2: String(id),
				});
			default:
				return `${reviewUnit} ${id}`;
		}
	});
</script>

<Badge
	{testId}
	tooltip={badgeDetails}
	style={getBadgeStyle(status)}
	kind="soft"
	{icon}
	reversedDirection
>
	{#if status === "draft"}
		{$i18nMessages.t("ui:ReviewBadge.draftValue", { reviewUnit: String(reviewUnit) })}
	{:else}
		{reviewUnit} {id}
	{/if}
</Badge>
