<script module lang="ts">
	export type PrStatusInfoType = "loading" | "open" | "merged" | "closed" | "draft";
</script>

<script lang="ts">
	import Badge from "$components/Badge.svelte";
	import { type IconName } from "$lib/icons/names";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import type { ComponentColorType } from "$lib/utils/colorTypes";
	const i18nMessages = useTranslations();

	interface Props {
		status: PrStatusInfoType;
	}

	type StatusInfo = {
		text: string;
		icon: IconName;
		style?: ComponentColorType;
	};

	const { status }: Props = $props();

	const prStatusInfo: StatusInfo = $derived.by(() => {
		switch (status) {
			case "loading":
				return { text: "Loading...", icon: "spinner", style: "gray" };
			case "merged":
				return {
					text: $i18nMessages.t("ui:PrStatusBadge.detail0c4455982"),
					icon: "pr-tick",
					style: "purple",
				};
			case "closed":
				return {
					text: $i18nMessages.t("ui:PrStatusBadge.detail88d86b772"),
					icon: "pr-cross",
					style: "danger",
				};
			case "draft":
				return {
					text: $i18nMessages.t("ui:PrStatusBadge.detail23d33e22a"),
					icon: "pr-draft",
					style: "gray",
				};
			default:
				return {
					text: $i18nMessages.t("ui:PrStatusBadge.detailcf9b77061"),
					icon: "pr",
					style: "safe",
				};
		}
	});
</script>

<Badge style={prStatusInfo.style} kind="soft" reversedDirection size="icon" icon={prStatusInfo.icon}
	>{prStatusInfo.text}</Badge
>
