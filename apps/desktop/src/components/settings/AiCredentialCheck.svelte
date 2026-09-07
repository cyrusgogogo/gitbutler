<script lang="ts">
	import { AI_SERVICE, type DiffInput } from "$lib/ai/service";
	import { ModelKind } from "$lib/ai/types";
	import { canonicalMessages } from "$lib/notifications/toasts";
	import { USER_SERVICE } from "$lib/user/userService.svelte";
	import { inject } from "@gitbutler/core/context";
	import { errorText, message as i18nMessage } from "@gitbutler/i18n";
	import { getI18n, useTranslations } from "@gitbutler/i18n/svelte";
	import { Button, InfoMessage, Link } from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { slide } from "svelte/transition";
	import type { LocalizedText } from "@gitbutler/i18n";
	const i18nMessages = useTranslations();
	const i18n = getI18n();

	const aiService = inject(AI_SERVICE);
	const userService = inject(USER_SERVICE);

	let testing = $state(false);
	let isStreaming = $state(false);
	let result = $state<string | null>(null);
	let streamingResult = $state<string>("");
	let error = $state<LocalizedText | null>(null);
	let modelKind = $state<ModelKind | undefined>();
	let isUsingButlerAPI = $state(false);
	let debugInfo = $state<string | null>(null);
	let showDebug = $state(false);
	let showSampleDiff = $state(false);
	let testTimeout: NodeJS.Timeout | null = null;
	let abortController: AbortController | null = null;

	// Simple test diff for commit message generation
	const testDiff: DiffInput[] = [
		{
			filePath: "example.js",
			diff: `@@ -1,3 +1,5 @@
 function hello() {
  -  return "Hello World";
  +  // Add a greeting with the current time
  +  const now = new Date();
  +  return \`Hello World! The time is \${now.toLocaleTimeString()}\`;
 }`,
		},
	];

	async function testAiCredentials() {
		testing = true;
		isStreaming = false;
		result = null;
		streamingResult = "";
		error = null;
		debugInfo = null;

		// Clear any existing timeout
		if (testTimeout) {
			clearTimeout(testTimeout);
			testTimeout = null;
		}

		// Abort any pending request
		if (abortController) {
			abortController.abort();
		}

		// Create a new abort controller for this request
		abortController = new AbortController();

		try {
			// Get current model kind
			modelKind = await aiService.getModelKind();
			debugInfo = `Model kind: ${modelKind}`;

			// Check if using GitButler API
			isUsingButlerAPI = await aiService.usingGitButlerAPI();
			debugInfo += `, Using GB API: ${isUsingButlerAPI}`;

			// Check if configuration is valid
			const isConfigValid = await aiService.validateConfiguration();
			debugInfo += `, Config valid: ${isConfigValid}`;

			if (!isConfigValid) {
				if (modelKind === ModelKind.OpenAI || modelKind === ModelKind.Anthropic) {
					if (isUsingButlerAPI && !userService.user) {
						throw i18n.error("desktop:ai.validation.signIn");
					} else {
						throw i18n.error("desktop:ai.validation.apiKey");
					}
				} else if (modelKind === ModelKind.Ollama) {
					// Get Ollama configuration for more detailed error
					const endpoint = await aiService.getOllamaEndpoint();
					const model = await aiService.getOllamaModelName();
					throw i18n.error("desktop:ai.validation.ollama", { endpoint, model });
				} else if (modelKind === ModelKind.LMStudio) {
					// Get LM Studio configuration for more detailed error
					const endpoint = await aiService.getLMStudioEndpoint();
					throw i18n.error("desktop:ai.validation.lmstudio", { endpoint });
				}
			}

			debugInfo += `, Testing commit message generation`;

			// Set a timeout to fail if the streaming doesn't start or complete
			testTimeout = setTimeout(() => {
				if (testing) {
					console.error("AI response timed out after 20 seconds");
					error = i18nMessage("desktop:detail.4d05df5b9f");
					testing = false;
					isStreaming = false; // Make sure streaming state is reset on timeout
					debugInfo += `, Timeout after 20s`;

					// Abort the request if possible
					if (abortController) {
						try {
							abortController.abort();
						} catch (err) {
							console.error("Error aborting request:", err);
						}
					}

					// Force a UI update (this ensures the reactive system recognizes the state changes)
					testing = false;
					isStreaming = false;
				}
			}, 20000);

			// Start streaming mode
			isStreaming = true;

			// Use the summarizeCommit method with the onToken callback for streaming
			const aiResult = await aiService.summarizeCommit({
				diffInput: testDiff,
				useEmojiStyle: false,
				useExtraConciseStyle: false,
				onToken: (token) => {
					// Append each token as it comes in
					streamingResult += token;
				},
			});

			// Clear the timeout since we got a result
			if (testTimeout) {
				clearTimeout(testTimeout);
				testTimeout = null;
			}

			// Set the final result (handling undefined case)
			result = aiResult || streamingResult || null;

			debugInfo += `, Received commit message: ${result?.substring(0, 30)}${result && result.length > 30 ? "..." : ""}`;

			// If result is empty or undefined, show an error
			if (!result || result.trim() === "") {
				throw i18n.error("desktop:ai.validation.emptyResponse");
			}
		} catch (e) {
			console.error("AI credential check error:", e);

			// Don't show abort errors as they're expected when we cancel the request
			if (e instanceof Error && e.name === "AbortError") {
				error = i18nMessage("desktop:detail.444c0b069a");
			} else {
				error = errorText(e, i18nMessage("common:unknownError"));
			}

			debugInfo += `, Error: ${canonicalMessages.text(error)}`;

			// Clear the timeout if there was an error
			if (testTimeout) {
				clearTimeout(testTimeout);
				testTimeout = null;
			}

			// Ensure streaming and testing states are reset on error
			isStreaming = false;
			testing = false;
		} finally {
			testing = false;
			isStreaming = false;
			abortController = null;
		}
	}

	function toggleDebug() {
		showDebug = !showDebug;
	}

	function toggleSampleMessage() {
		showSampleDiff = !showSampleDiff;
	}
</script>

<div class="ai-credential-check">
	{#if isStreaming || result || error}
		<div transition:slide={{ duration: 250 }}>
			<InfoMessage
				style={error ? "danger" : "success"}
				icon={error ? "danger" : isStreaming ? "robot" : "tick"}
				filled
				outlined={false}
			>
				{#snippet title()}
					{#if error}
						{$i18nMessages.t("desktop:AiCredentialCheck.aICredentialCheckFailed")}
					{:else if result}
						{$i18nMessages.t("desktop:AiCredentialCheck.aICredentialCheckPassed")}
					{:else if isStreaming}
						{$i18nMessages.t("desktop:AiCredentialCheck.aIIsResponding")}
					{/if}
				{/snippet}

				{#snippet content()}
					<div class="result-content" transition:slide={{ duration: 250 }}>
						{#if error}
							{#if (modelKind === ModelKind.OpenAI || modelKind === ModelKind.Anthropic) && isUsingButlerAPI && !userService.user}
								<span
									>{$i18nMessages.t(
										"desktop:AiCredentialCheck.pleaseSignInToUseGitButlerSAI",
									)}</span
								>
							{:else if modelKind === ModelKind.OpenAI || modelKind === ModelKind.Anthropic}
								<span
									>{$i18nMessages.t(
										"desktop:AiCredentialCheck.pleaseCheckYourAPIKeyOrTryGitButler",
									)}</span
								>
							{:else if modelKind === ModelKind.Ollama}
								<span>
									{#snippet i18nSlot3()}<br />{/snippet}
									<I18nRichMessage
										value={{
											key: "desktop:AiCredentialCheck.pleaseCheckYourOllamaEndpointAndModelConfiguration",
										}}
										components={{ slot3: i18nSlot3 }}
									/>

									<Link href="https://ollama.ai"
										>{$i18nMessages.t("desktop:AiCredentialCheck.learnMore")}</Link
									>
								</span>
							{:else if modelKind === ModelKind.LMStudio}
								<span>
									{#snippet i18nSlot4()}<br />{/snippet}
									<I18nRichMessage
										value={{
											key: "desktop:AiCredentialCheck.pleaseCheckYourLMStudioConfigurationMakeSure",
										}}
										components={{ slot4: i18nSlot4 }}
									/>

									<Link href="https://lmstudio.ai"
										>{$i18nMessages.t("desktop:AiCredentialCheck.learnMore")}</Link
									>
								</span>
							{/if}
						{:else}
							<div class="text-12 text-body ai-response">
								<pre class:streaming={isStreaming}>{isStreaming
										? streamingResult
											? streamingResult.trim()
											: "Loading..."
										: `Response:\n\n${result?.trim()}`}
								</pre>
							</div>
						{/if}
					</div>
				{/snippet}
			</InfoMessage>
		</div>
	{/if}
	<Button style="pop" wide icon="ai" disabled={testing || isStreaming} onclick={testAiCredentials}>
		{#if testing || isStreaming}
			{isStreaming
				? $i18nMessages.t("desktop:AiCredentialCheck.aIIsResponding")
				: $i18nMessages.t("desktop:AiCredentialCheck.testingAIConnection")}
		{:else if error}
			{$i18nMessages.t("desktop:AiCredentialCheck.tryAgain")}
		{:else if result}
			{$i18nMessages.t("desktop:AiCredentialCheck.testAgain")}
		{:else}
			{$i18nMessages.t("desktop:AiCredentialCheck.testAIConnection")}
		{/if}
	</Button>

	{#if showDebug && debugInfo}
		<div class="debug-info text-12 text-body">
			<p>
				{#snippet i18nSlot5(content: import("svelte").Snippet)}<span class="text-bold"
						>{@render content()}</span
					>{/snippet}
				<I18nRichMessage
					value={{ key: "desktop:AiCredentialCheck.debugInfo" }}
					components={{ slot5: i18nSlot5 }}
				/>
			</p>
			<p>{debugInfo}</p>
		</div>
	{/if}

	{#if showSampleDiff}
		<div class="debug-info text-12 text-body">
			<p class="text-bold">{$i18nMessages.t("desktop:AiCredentialCheck.sampleDiff")}</p>
			<pre class="debug-info__code">{testDiff[0]?.diff}</pre>
		</div>
	{/if}

	<div class="debug-info-buttons">
		<button type="button" class="text-12 debug-button" onclick={toggleSampleMessage}>
			{$i18nMessages.t(
				showSampleDiff ? "desktop:ai.hideshowSampleDiff" : "desktop:ai.showshowSampleDiff",
			)}
		</button>
		<button
			type="button"
			class="text-12 debug-button"
			class:debug-button_disabled={!debugInfo}
			onclick={toggleDebug}
		>
			{$i18nMessages.t(showDebug ? "desktop:ai.hideshowDebug" : "desktop:ai.showshowDebug")}
		</button>
	</div>
</div>

<style>
	.ai-credential-check {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.result-content {
		display: flex;
		flex-direction: column;
		margin-top: 4px;
		overflow-x: auto;
		gap: 4px;
	}

	.ai-response {
		display: flex;
		flex-direction: column;
		gap: 10px;
		border-radius: var(--radius-m);
		background-color: var(--bg-1);

		pre {
			max-width: 100%;
			padding: 14px;
			overflow-x: auto;
			white-space: pre;
		}
	}

	/* DEBUG SECTION */
	.debug-button {
		border: none;
		background: none;
		color: var(--text-2);
		font-size: 11px;
		text-decoration: underline dotted;
		cursor: pointer;
	}

	.debug-button_disabled {
		color: var(--text-3);
		cursor: not-allowed;
	}

	.debug-info-buttons {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		width: auto;
		margin-top: 4px;
		gap: 14px;
	}

	.debug-info {
		display: flex;
		flex-direction: column;
		margin-bottom: -8px;
		padding: 14px;
		gap: 4px;
		border-radius: var(--radius-m);
		background-color: var(--bg-2);
	}

	.debug-info__code {
		white-space: pre-wrap;
	}
</style>
