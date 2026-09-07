<script lang="ts">
	import Factoid from "$lib/components/infoFlexRow/Factoid.svelte";
	import InfoFlexRow from "$lib/components/infoFlexRow/InfoFlexRow.svelte";
	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { getChatChannelParticipants } from "@gitbutler/shared/chat/chatChannelsPreview.svelte";
	import { CHAT_CHANNELS_SERVICE } from "@gitbutler/shared/chat/chatChannelsService";
	import {
		getUsersWithAvatars,
		getPatchApproversWithAvatars,
		getPatchContributorsWithAvatars,
		getPatchRejectorsWithAvatars,
	} from "@gitbutler/shared/contributors";
	import ChangeStatus from "@gitbutler/shared/patches/ChangeStatus.svelte";
	import { type PatchCommit } from "@gitbutler/shared/patches/types";
	import { APP_STATE } from "@gitbutler/shared/redux/store.svelte";
	import { AvatarGroup, Icon } from "@gitbutler/ui";
	import { copyToClipboard } from "@gitbutler/ui/utils/clipboard";
	import { untrack } from "svelte";
	const i18nMessages = useTranslations();

	const NO_REVIEWERS = $derived($i18nMessages.t("web:detail.4e21ffae44"));
	const NO_CONTRIBUTORS = $derived($i18nMessages.t("web:detail.84f04f6f89"));
	const NO_COMMENTS = $derived($i18nMessages.t("web:detail.d14da37946"));

	interface Props {
		projectId: string;
		patchCommit: PatchCommit;
	}

	const { patchCommit, projectId }: Props = $props();
	const appState = inject(APP_STATE);
	const chatChannelService = inject(CHAT_CHANNELS_SERVICE);

	const chatParticipants = $derived(
		getChatChannelParticipants(appState, chatChannelService, projectId, patchCommit.changeId),
	);

	const commenters = $derived(
		chatParticipants.current === undefined
			? Promise.resolve([])
			: getUsersWithAvatars(chatParticipants.current),
	);
	const contributors = $derived(getPatchContributorsWithAvatars(patchCommit));
	const approvers = $derived(getPatchApproversWithAvatars(patchCommit));
	const rejectors = $derived(getPatchRejectorsWithAvatars(patchCommit));

	const commitShortSha = untrack(() => patchCommit).commitSha.substring(0, 7);
</script>

<InfoFlexRow>
	<Factoid label={$i18nMessages.t("web:ReviewInfo.status")}>
		<ChangeStatus {patchCommit} />
	</Factoid>
	<Factoid label={$i18nMessages.t("web:ReviewInfo.reviewedBy")} placeholderText={NO_REVIEWERS}>
		{#await Promise.all([approvers, rejectors]) then [approvers, rejectors]}
			{#if approvers.length > 0 || rejectors.length > 0}
				<AvatarGroup avatars={rejectors} maxAvatars={2} icon="refresh" iconColor="warning" />
				<AvatarGroup avatars={approvers} maxAvatars={2} icon="tick" iconColor="safe" />
			{/if}
		{/await}
	</Factoid>
	<Factoid label={$i18nMessages.t("web:ReviewInfo.commentedBy")} placeholderText={NO_COMMENTS}>
		{#await commenters then commentors}
			{#if commentors.length > 0}
				<AvatarGroup avatars={commentors} />
			{/if}
		{/await}
	</Factoid>
	<Factoid label={$i18nMessages.t("web:ReviewInfo.authors")} placeholderText={NO_CONTRIBUTORS}>
		{#await contributors then contributors}
			{#if contributors.length > 0}
				<AvatarGroup avatars={contributors} />
			{/if}
		{/await}
	</Factoid>
	<Factoid label={$i18nMessages.t("web:ReviewInfo.version")}>
		v{patchCommit.version}
	</Factoid>
	<Factoid label={$i18nMessages.t("web:ReviewInfo.commitSHA")}>
		<button type="button" class="commit-sha" onclick={() => copyToClipboard(patchCommit.commitSha)}>
			<span>
				{commitShortSha}
			</span>
			<div class="factoid-icon">
				<Icon name="copy" size={14} />
			</div>
		</button>
	</Factoid>
</InfoFlexRow>

<style lang="postcss">
	.commit-sha {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 2px;
		text-decoration-line: underline;
		text-decoration-style: dashed;
		text-underline-offset: 2px;
		cursor: pointer;

		&:hover {
			.factoid-icon {
				opacity: 1;
			}
		}
	}

	.factoid-icon {
		color: var(--text-2);
		opacity: 0;
		transition: opacity var(--transition-fast);
	}
</style>
