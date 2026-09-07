<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { CardGroup, Spacer, Toggle } from "@gitbutler/ui";
	import type { NotificationSettingsService } from "@gitbutler/shared/settings/notificationSettingsService";
	import type { NotificationSettings as NotificationSettingsType } from "@gitbutler/shared/settings/types";
	const i18nMessages = useTranslations();

	interface Props {
		notificationSettings: NotificationSettingsType;
		notificationSettingsService: NotificationSettingsService;
	}

	let { notificationSettings, notificationSettingsService }: Props = $props();

	let updatingReceiveChatMentionEmails = $state(false);
	let updatingReceiveChatReplyEmails = $state(false);
	let updatingReceiveIssueCreationEmails = $state(false);
	let updatingReceiveIssueResolutionEmails = $state(false);
	let updatingReceiveReviewBranchEmails = $state(false);
	let updatingReceiveSignOffEmails = $state(false);

	async function updateReceiveChatMentionEmails(value: boolean) {
		updatingReceiveChatMentionEmails = true;
		await notificationSettingsService.updateNotificationSettings({
			receiveChatMentionEmails: value,
		});
		updatingReceiveChatMentionEmails = false;
	}

	async function updateReceiveChatReplyEmails(value: boolean) {
		updatingReceiveChatReplyEmails = true;
		await notificationSettingsService.updateNotificationSettings({
			receiveChatReplyEmails: value,
		});
		updatingReceiveChatReplyEmails = false;
	}

	async function updateReceiveIssueCreationEmails(value: boolean) {
		updatingReceiveIssueCreationEmails = true;
		await notificationSettingsService.updateNotificationSettings({
			receiveIssueCreationEmails: value,
		});
		updatingReceiveIssueCreationEmails = false;
	}

	async function updateReceiveIssueResolutionEmails(value: boolean) {
		updatingReceiveIssueResolutionEmails = true;
		await notificationSettingsService.updateNotificationSettings({
			receiveIssueResolutionEmails: value,
		});
		updatingReceiveIssueResolutionEmails = false;
	}

	async function updateReceiveReviewBranchEmails(value: boolean) {
		updatingReceiveReviewBranchEmails = true;
		await notificationSettingsService.updateNotificationSettings({
			receiveReviewBranchEmails: value,
		});
		updatingReceiveReviewBranchEmails = false;
	}

	async function updateReceiveSignOffEmails(value: boolean) {
		updatingReceiveSignOffEmails = true;
		await notificationSettingsService.updateNotificationSettings({
			receiveSignOffEmails: value,
		});
		updatingReceiveSignOffEmails = false;
	}
</script>

<Spacer />

<div class="stack-v gap-8">
	<h2 class="text-15 text-bold">
		{$i18nMessages.t("web:NotificationSettings.notificationSettings")}
	</h2>
	<p class="text-12 text-body clr-text-2">
		{$i18nMessages.t(
			"web:NotificationSettings.manageYourEmailNotificationPreferencesForVariousActivities",
		)}
	</p>
</div>

<CardGroup>
	<CardGroup.Item labelFor="receive-chat-mention-emails">
		{#snippet title()}
			{$i18nMessages.t("web:NotificationSettings.chatMessageMentionEmails")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:NotificationSettings.emailsWhenYouAreMentionedInAMessage")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="receive-chat-mention-emails"
				checked={notificationSettings.receiveChatMentionEmails}
				disabled={updatingReceiveChatMentionEmails}
				onclick={() =>
					updateReceiveChatMentionEmails(!notificationSettings.receiveChatMentionEmails)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="receive-chat-reply-emails">
		{#snippet title()}
			{$i18nMessages.t("web:NotificationSettings.chatMessageReplyEmails")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:NotificationSettings.emailsWhenYouReceiveAReplyToA")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="receive-chat-reply-emails"
				checked={notificationSettings.receiveChatReplyEmails}
				disabled={updatingReceiveChatReplyEmails}
				onclick={() => updateReceiveChatReplyEmails(!notificationSettings.receiveChatReplyEmails)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="receive-issue-creation-emails">
		{#snippet title()}
			{$i18nMessages.t("web:NotificationSettings.issueCreationEmails")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:NotificationSettings.emailsForNewIssuesCreatedInChangesYou")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="receive-issue-creation-emails"
				checked={notificationSettings.receiveIssueCreationEmails}
				disabled={updatingReceiveIssueCreationEmails}
				onclick={() =>
					updateReceiveIssueCreationEmails(!notificationSettings.receiveIssueCreationEmails)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="receive-issue-resolution-emails">
		{#snippet title()}
			{$i18nMessages.t("web:NotificationSettings.issueStatusEmails")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:NotificationSettings.emailsForStatusUpdatesOfIssuesInChanges")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="receive-issue-resolution-emails"
				checked={notificationSettings.receiveIssueResolutionEmails}
				disabled={updatingReceiveIssueResolutionEmails}
				onclick={() =>
					updateReceiveIssueResolutionEmails(!notificationSettings.receiveIssueResolutionEmails)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="receive-review-branch-emails">
		{#snippet title()}
			{$i18nMessages.t("web:NotificationSettings.branchVersionUpdateEmails")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:NotificationSettings.emailsWhenANewReviewBranchVersionIs")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="receive-review-branch-emails"
				checked={notificationSettings.receiveReviewBranchEmails}
				disabled={updatingReceiveReviewBranchEmails}
				onclick={() =>
					updateReceiveReviewBranchEmails(!notificationSettings.receiveReviewBranchEmails)}
			/>
		{/snippet}
	</CardGroup.Item>

	<CardGroup.Item labelFor="receive-sign-off-emails">
		{#snippet title()}
			{$i18nMessages.t("web:NotificationSettings.changeStatusUpdateEmails")}
		{/snippet}
		{#snippet caption()}
			{$i18nMessages.t("web:NotificationSettings.emailsForUpdatesOnTheReviewStatusOf")}
		{/snippet}
		{#snippet actions()}
			<Toggle
				id="receive-sign-off-emails"
				checked={notificationSettings.receiveSignOffEmails}
				disabled={updatingReceiveSignOffEmails}
				onclick={() => updateReceiveSignOffEmails(!notificationSettings.receiveSignOffEmails)}
			/>
		{/snippet}
	</CardGroup.Item>
</CardGroup>
