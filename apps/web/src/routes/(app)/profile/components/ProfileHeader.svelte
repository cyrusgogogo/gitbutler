<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, CardGroup, ProfilePictureUpload, Spacer, Textbox, Toggle } from "@gitbutler/ui";
	import type { User, UserService } from "$lib/user/userService";
	const i18nMessages = useTranslations();

	interface Props {
		user: User;
		userService: UserService;
	}

	let { user, userService }: Props = $props();

	let updatingName = $state(false);
	let updatingAdditionalInfo = $state(false);
	let nameValue = $state("");
	let emailValue = $state("");
	let websiteValue = $state("");
	let twitterValue = $state("");
	let blueskyValue = $state("");
	let locationValue = $state("");
	let emailShareValue = $state(false);

	$effect(() => {
		nameValue = user.name;
		emailValue = user.email;
		websiteValue = user.website || "";
		twitterValue = user.twitter || "";
		blueskyValue = user.bluesky || "";
		locationValue = user.location || "";
		emailShareValue = user.emailShare || false;
	});

	function onPictureChange(file: File) {
		updateProfilePicture(file);
	}

	async function updateProfilePicture(file: File) {
		try {
			await userService.updateUser({ picture: file });
		} catch (error) {
			console.error("Failed to update profile picture:", error);
			// TODO: Add toast notification for error
		}
	}

	async function updateName() {
		if (nameValue === user?.name) return;
		updatingName = true;
		try {
			await userService.updateUser({ name: nameValue });
		} finally {
			updatingName = false;
		}
	}

	async function updateAdditionalInfo() {
		updatingAdditionalInfo = true;
		try {
			await userService.updateUser({
				website: websiteValue,
				twitter: twitterValue,
				bluesky: blueskyValue,
				location: locationValue,
				timezone: "", // Not used in the UI currently
				emailShare: emailShareValue,
			});
		} finally {
			updatingAdditionalInfo = false;
		}
	}
</script>

<CardGroup>
	<form onsubmit={updateAdditionalInfo}>
		<CardGroup.Item>
			<div class="profile-header">
				<ProfilePictureUpload picture={user.picture} onFileSelect={onPictureChange} />

				<div class="contact-info__fields">
					<Textbox
						id="full-name"
						label={$i18nMessages.t("web:ProfileHeader.fullName")}
						type="text"
						bind:value={nameValue}
						readonly={updatingName}
						onblur={updateName}
						onkeydown={(e) => e.key === "Enter" && updateName()}
					/>
					<Textbox
						id="email"
						label={$i18nMessages.t("web:ProfileHeader.email")}
						type="text"
						bind:value={emailValue}
						readonly={true}
					/>
				</div>
			</div>
		</CardGroup.Item>

		<CardGroup.Item>
			<div class="contact-info__fields">
				<Textbox
					id="website"
					label={$i18nMessages.t("web:ProfileHeader.website")}
					type="url"
					placeholder="https://example.com"
					bind:value={websiteValue}
					readonly={updatingAdditionalInfo}
				/>

				<Textbox
					id="twitter"
					label={$i18nMessages.t("web:ProfileHeader.twitter")}
					type="text"
					placeholder={$i18nMessages.t("web:ProfileHeader.username")}
					bind:value={twitterValue}
					readonly={updatingAdditionalInfo}
				/>

				<Textbox
					id="bluesky"
					label="Bluesky"
					type="text"
					placeholder={$i18nMessages.t("web:ProfileHeader.handleBskySocial")}
					bind:value={blueskyValue}
					readonly={updatingAdditionalInfo}
				/>

				<Textbox
					id="location"
					label={$i18nMessages.t("web:ProfileHeader.location")}
					type="text"
					placeholder={$i18nMessages.t("web:ProfileHeader.cityCountry")}
					bind:value={locationValue}
					readonly={updatingAdditionalInfo}
				/>

				<Spacer dotted />

				<label class="checkbox-section" for="email-share">
					<div class="checkbox-section__label">
						<h3 class="text-15 text-bold">{$i18nMessages.t("web:ProfileHeader.shareMyEmail")}</h3>
						<p class="text-12 text-body clr-text-2">
							{$i18nMessages.t("web:ProfileHeader.allowOtherUsersToSeeYourEmailAddress")}
						</p>
					</div>
					<Toggle
						id="email-share"
						checked={emailShareValue}
						disabled={updatingAdditionalInfo}
						onclick={() => (emailShareValue = !emailShareValue)}
					/>
				</label>
			</div>
		</CardGroup.Item>

		<CardGroup.Item>
			<div class="flex justify-end">
				<Button
					type="submit"
					style="pop"
					loading={updatingAdditionalInfo}
					disabled={updatingAdditionalInfo}
				>
					{updatingAdditionalInfo
						? $i18nMessages.t("web:ProfileHeader.saving")
						: $i18nMessages.t("web:ProfileHeader.updateProfile")}
				</Button>
			</div>
		</CardGroup.Item>
	</form>
</CardGroup>

<style lang="postcss">
	.profile-header {
		display: flex;
		gap: 24px;
	}

	.contact-info__fields {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 12px;
	}

	.checkbox-section {
		display: flex;
	}

	.checkbox-section__label {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 4px;
	}
</style>
