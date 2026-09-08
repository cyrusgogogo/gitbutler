<script lang="ts">
	import AIPromptEdit from "$components/settings/AIPromptEdit.svelte";
	import AiCredentialCheck from "$components/settings/AiCredentialCheck.svelte";

	import SettingsSection from "$components/shared/SettingsSection.svelte";
	import { AISecretHandle, AI_SERVICE, GitAIConfigKey } from "$lib/ai/service";
	import { OpenAIModelName, AnthropicModelName, ModelKind } from "$lib/ai/types";
	import { GIT_CONFIG_SERVICE } from "$lib/config/gitConfigService";
	import { SECRET_SERVICE } from "$lib/secrets/secretsService";

	import { inject } from "@gitbutler/core/context";
	import { useTranslations } from "@gitbutler/i18n/svelte";
	import {
		CardGroup,
		InfoMessage,
		Link,
		RadioButton,
		Select,
		SelectItem,
		Spacer,
		Textbox,
	} from "@gitbutler/ui";
	import I18nRichMessage from "@gitbutler/ui/i18n/RichMessage.svelte";
	import { onMount, tick } from "svelte";
	import { run } from "svelte/legacy";
	const i18nMessages = useTranslations();

	const gitConfigService = inject(GIT_CONFIG_SERVICE);
	const secretsService = inject(SECRET_SERVICE);
	const aiService = inject(AI_SERVICE);

	let initialized = false;

	let modelKind: ModelKind | undefined = $state();

	let openAIKey: string | undefined = $state();
	let openAICustomEndpoint: string | undefined = $state();
	let openAIModelName: OpenAIModelName | undefined = $state();
	let anthropicKey: string | undefined = $state();
	let anthropicModelName: AnthropicModelName | undefined = $state();
	let diffLengthLimit: number | undefined = $state();
	let ollamaEndpoint: string | undefined = $state();
	let ollamaModel: string | undefined = $state();
	let lmStudioEndpoint: string | undefined = $state();
	let lmStudioModel: string | undefined = $state();
	let openRouterKey: string | undefined = $state();
	let openRouterModel: string | undefined = $state();

	async function setConfiguration(key: GitAIConfigKey, value: string | undefined) {
		if (!initialized) return;
		gitConfigService.set(key, value || "");
	}

	async function setSecret(handle: AISecretHandle, secret: string | undefined) {
		if (!initialized) return;
		await secretsService.set(handle, secret || "");
	}

	onMount(async () => {
		modelKind = await aiService.getModelKind();

		openAIModelName = await aiService.getOpenAIModelName();
		openAIKey = await aiService.getOpenAIKey();
		openAICustomEndpoint = await aiService.getOpenAICustomEndpoint();

		anthropicModelName = await aiService.getAnthropicModelName();
		anthropicKey = await aiService.getAnthropicKey();

		diffLengthLimit = await aiService.getDiffLengthLimit();

		ollamaEndpoint = await aiService.getOllamaEndpoint();
		ollamaModel = await aiService.getOllamaModelName();

		lmStudioEndpoint = await aiService.getLMStudioEndpoint();
		lmStudioModel = await aiService.getLMStudioModelName();

		openRouterKey = await aiService.getOpenRouterKey();
		openRouterModel = await aiService.getOpenRouterModelName();

		// Ensure reactive declarations have finished running before we set initialized to true
		await tick();

		initialized = true;
	});

	const openAIModelOptions = $derived([
		{
			label: $i18nMessages.t("desktop:AiSettings.gPT54"),
			value: OpenAIModelName.GPT54,
		},
		{
			label: $i18nMessages.t("desktop:AiSettings.gPT54Mini"),
			value: OpenAIModelName.GPT54Mini,
		},
		{
			label: $i18nMessages.t("desktop:AiSettings.gPT54NanoRecommended"),
			value: OpenAIModelName.GPT54Nano,
		},
	]);

	const anthropicModelOptions = $derived([
		{
			label: $i18nMessages.t("desktop:AiSettings.haikuRecommended"),
			value: AnthropicModelName.Haiku,
		},
		{
			label: $i18nMessages.t("desktop:AiSettings.sonnet"),
			value: AnthropicModelName.Sonnet,
		},
		{
			label: $i18nMessages.t("desktop:AiSettings.opus"),
			value: AnthropicModelName.Opus,
		},
	]);

	let form = $state<HTMLFormElement>();

	function onFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		modelKind = formData.get("modelKind") as ModelKind;
	}
	run(() => {
		setConfiguration(GitAIConfigKey.ModelProvider, modelKind);
	});

	run(() => {
		setConfiguration(GitAIConfigKey.OpenAIModelName, openAIModelName);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.OpenAICustomEndpoint, openAICustomEndpoint);
	});
	run(() => {
		setSecret(AISecretHandle.OpenAIKey, openAIKey);
	});

	run(() => {
		setConfiguration(GitAIConfigKey.AnthropicModelName, anthropicModelName);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.DiffLengthLimit, diffLengthLimit?.toString());
	});
	run(() => {
		setSecret(AISecretHandle.AnthropicKey, anthropicKey);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.OllamaEndpoint, ollamaEndpoint);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.OllamaModelName, ollamaModel);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.LMStudioEndpoint, lmStudioEndpoint);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.LMStudioModelName, lmStudioModel);
	});
	run(() => {
		setSecret(AISecretHandle.OpenRouterKey, openRouterKey);
	});
	run(() => {
		setConfiguration(GitAIConfigKey.OpenRouterModelName, openRouterModel);
	});
	run(() => {
		if (form) form.modelKind.value = modelKind;
	});
</script>

<p class="text-13 text-body ai-settings__about-text">
	{$i18nMessages.t("desktop:AiSettings.gitButlerSupportsMultipleAIProvidersOpenAIAndAnthropic")}
</p>

<CardGroup>
	<form class="git-radio" bind:this={form} onchange={(e) => onFormChange(e.currentTarget)}>
		<CardGroup.Item labelFor="open-ai">
			{#snippet title()}
				{$i18nMessages.t("desktop:AiSettings.openAI")}
			{/snippet}
			{#snippet actions()}
				<RadioButton name="modelKind" id="open-ai" value={ModelKind.OpenAI} />
			{/snippet}
		</CardGroup.Item>
		{#if modelKind === ModelKind.OpenAI}
			<CardGroup.Item>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.aPIKey")}
					type="password"
					bind:value={openAIKey}
					required
					placeholder={$i18nMessages.t("desktop:AiSettings.sk")}
				/>

				<Select
					value={openAIModelName}
					options={openAIModelOptions}
					label={$i18nMessages.t("desktop:AiSettings.modelVersion")}
					wide
					onselect={(value) => {
						openAIModelName = value as OpenAIModelName;
					}}
				>
					{#snippet itemSnippet({ item, highlighted })}
						<SelectItem selected={item.value === openAIModelName} {highlighted}>
							{item.label}
						</SelectItem>
					{/snippet}
				</Select>

				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.customEndpoint")}
					bind:value={openAICustomEndpoint}
					placeholder="https://api.openai.com/v1"
				/>
			</CardGroup.Item>
		{/if}

		<CardGroup.Item labelFor="anthropic">
			{#snippet title()}
				Anthropic
			{/snippet}
			{#snippet actions()}
				<RadioButton name="modelKind" id="anthropic" value={ModelKind.Anthropic} />
			{/snippet}
		</CardGroup.Item>
		{#if modelKind === ModelKind.Anthropic}
			<CardGroup.Item>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.aPIKey")}
					type="password"
					bind:value={anthropicKey}
					required
					placeholder={$i18nMessages.t("desktop:AiSettings.skAntApi03")}
				/>

				<Select
					value={anthropicModelName}
					options={anthropicModelOptions}
					label={$i18nMessages.t("desktop:AiSettings.modelVersion")}
					onselect={(value) => {
						anthropicModelName = value as AnthropicModelName;
					}}
				>
					{#snippet itemSnippet({ item, highlighted })}
						<SelectItem selected={item.value === anthropicModelName} {highlighted}>
							{item.label}
						</SelectItem>
					{/snippet}
				</Select>
			</CardGroup.Item>
		{/if}

		<CardGroup.Item labelFor="ollama">
			{#snippet title()}
				{$i18nMessages.t("desktop:AiSettings.ollama")}
			{/snippet}
			{#snippet actions()}
				<RadioButton name="modelKind" id="ollama" value={ModelKind.Ollama} />
			{/snippet}
		</CardGroup.Item>
		{#if modelKind === ModelKind.Ollama}
			<CardGroup.Item>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.endpoint")}
					bind:value={ollamaEndpoint}
					placeholder="http://127.0.0.1:11434"
				/>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.model")}
					bind:value={ollamaModel}
					placeholder={$i18nMessages.t("desktop:AiSettings.llama3")}
				/>
				<InfoMessage filled outlined={false}>
					{#snippet title()}
						{$i18nMessages.t("desktop:AiSettings.configuringOllama")}
					{/snippet}
					{#snippet content()}
						{#snippet i18nSlot1(content: import("svelte").Snippet)}<b>{@render content()}</b
							>{/snippet}
						{#snippet i18nSlot2()}<br />{/snippet}
						<I18nRichMessage
							value={{ key: "desktop:AiSettings.toConnectToYourOllamaEndpointAllowList" }}
							components={{ slot1: i18nSlot1, slot2: i18nSlot2 }}
						/>
						<Link href="https://docs.gitbutler.com/troubleshooting/custom-csp"
							>{$i18nMessages.t("desktop:AiSettings.docsForDetails")}</Link
						>
					{/snippet}
				</InfoMessage>
			</CardGroup.Item>
		{/if}

		<CardGroup.Item labelFor="lmstudio">
			{#snippet title()}
				{$i18nMessages.t("desktop:AiSettings.lMStudio")}
			{/snippet}
			{#snippet actions()}
				<RadioButton name="modelKind" id="lmstudio" value={ModelKind.LMStudio} />
			{/snippet}
		</CardGroup.Item>
		{#if modelKind === ModelKind.LMStudio}
			<CardGroup.Item>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.endpoint")}
					bind:value={lmStudioEndpoint}
					placeholder="http://127.0.0.1:1234"
				/>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.model")}
					bind:value={lmStudioModel}
					placeholder={$i18nMessages.t("desktop:AiSettings.default")}
				/>
				<InfoMessage filled outlined={false}>
					{#snippet title()}
						{$i18nMessages.t("desktop:AiSettings.configuringLMStudio")}
					{/snippet}
					{#snippet content()}
						<div class="ai-settings__section-text-block">
							<p>
								{$i18nMessages.t("desktop:AiSettings.connectingToYourLMStudioEndpointRequiresThat")}
							</p>

							<p>
								{#snippet i18nSlot3(content: import("svelte").Snippet)}<span class="text-bold"
										>{@render content()}</span
									>{/snippet}
								<I18nRichMessage
									value={{ key: "desktop:AiSettings.1AllowListItInTheCSPSettings" }}
									components={{ slot3: i18nSlot3 }}
								/>
								<Link href="https://docs.gitbutler.com/troubleshooting/custom-csp"
									>{$i18nMessages.t("desktop:AiSettings.gitButlerDocs")}</Link
								>.
							</p>

							<p>
								{#snippet i18nSlot4(content: import("svelte").Snippet)}<span class="text-bold"
										>{@render content()}</span
									>{/snippet}
								<I18nRichMessage
									value={{ key: "desktop:AiSettings.2EnableCORSSupportInLMStudioYou" }}
									components={{ slot4: i18nSlot4 }}
								/>
								<Link href="https://lmstudio.ai/docs/cli/server-start#enable-cors-support"
									>{$i18nMessages.t("desktop:AiSettings.lMStudioDocs")}</Link
								>.
							</p>
						</div>
					{/snippet}
				</InfoMessage>
			</CardGroup.Item>
		{/if}

		<CardGroup.Item labelFor="openrouter">
			{#snippet title()}
				{$i18nMessages.t("desktop:AiSettings.openRouter")}
			{/snippet}
			{#snippet actions()}
				<RadioButton name="modelKind" id="openrouter" value={ModelKind.OpenRouter} />
			{/snippet}
		</CardGroup.Item>
		{#if modelKind === ModelKind.OpenRouter}
			<CardGroup.Item>
				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.aPIKey")}
					type="password"
					bind:value={openRouterKey}
					required
					placeholder={$i18nMessages.t("desktop:AiSettings.skOr")}
				/>

				<Textbox
					label={$i18nMessages.t("desktop:AiSettings.model")}
					bind:value={openRouterModel}
					placeholder={$i18nMessages.t("desktop:AiSettings.openaiGpt41Mini")}
				/>
			</CardGroup.Item>
		{/if}

		<CardGroup.Item>
			<AiCredentialCheck />
		</CardGroup.Item>
	</form>
</CardGroup>

<Spacer />

<CardGroup.Item standalone>
	{#snippet title()}
		{$i18nMessages.t("desktop:AiSettings.amountOfProvidedContext")}
	{/snippet}
	{#snippet caption()}
		{$i18nMessages.t("desktop:AiSettings.howManyCharactersOfYourGitDiffShould")}
	{/snippet}
	{#snippet actions()}
		<Textbox
			type="number"
			width={80}
			textAlign="center"
			value={diffLengthLimit?.toString()}
			minVal={100}
			oninput={(value: string) => {
				diffLengthLimit = parseInt(value);
			}}
			placeholder="5000"
		/>
	{/snippet}
</CardGroup.Item>

<Spacer />

<SettingsSection>
	{#snippet title()}
		{$i18nMessages.t("desktop:AiSettings.customAIPrompts")}
	{/snippet}
	{#snippet description()}
		{$i18nMessages.t("desktop:AiSettings.gitButlerSAIAssistantGeneratesCommitMessagesAnd")}
	{/snippet}

	<div class="prompt-groups">
		<AIPromptEdit promptUse="commits" />
		<Spacer margin={12} />
		<AIPromptEdit promptUse="branches" />
	</div>
</SettingsSection>

<style>
	.ai-settings__about-text {
		margin-bottom: 12px;
		color: var(--text-2);
	}

	.prompt-groups {
		display: flex;
		flex-direction: column;
		margin-top: 16px;
		gap: 12px;
	}

	.ai-settings__section-text-block {
		display: flex;
		flex-direction: column;
	}
</style>
