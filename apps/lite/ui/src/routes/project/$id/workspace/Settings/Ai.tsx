import { message as i18nMessage } from "@gitbutler/i18n";
import type { LocalizedText } from "@gitbutler/i18n";
import { Message as I18nMessage, useTranslations } from "@gitbutler/i18n/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FC } from "react";
import type { AiConfiguration, AiConfigurationUpdate } from "@gitbutler/but-sdk";
import { aiConfigurationQueryOptions } from "#ui/api/queries.ts";
import { getButtonClassName } from "#ui/components/Button.tsx";
import { classes } from "#ui/components/classes.ts";
import { errorMessageForToast } from "#ui/errors.ts";
import {
	anthropicModels,
	configurationUpdate,
	modelSelection,
	openAiModels,
	saveThenTest,
} from "./ai-settings.ts";
import { Row, Section } from "./Section.tsx";
import styles from "./Ai.module.css";

type Provider = AiConfigurationUpdate["provider"];

const providerLabels: Record<Provider, string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	ollama: "Ollama",
	lmstudio: "LM Studio",
};

const modelLabels: Record<string, LocalizedText> = {
	"gpt-5.4": "GPT 5.4",
	"gpt-5.4-mini": "GPT 5.4 Mini",
	"gpt-5.4-nano": i18nMessage("lite:model.GPT54Nanorecommended"),
	"claude-haiku-4-5": i18nMessage("lite:model.Haikurecommended"),
	"claude-sonnet-4-6": "Sonnet",
	"claude-opus-4-6": "Opus",
};

const ModelField: FC<{
	id: string;
	label: string;
	model: string;
	presets: ReadonlyArray<string>;
	onChange: (model: string) => void;
}> = (p) => {
	const i18nMessages = useTranslations();
	const selection = modelSelection(p.model, p.presets);
	return (
		<>
			<Row label={p.label} htmlFor={`${p.id}-preset`}>
				<select
					id={`${p.id}-preset`}
					value={selection}
					onChange={(event) => {
						const value = event.currentTarget.value;
						p.onChange(value === "custom" ? "" : value);
					}}
				>
					{p.presets.map((model) => (
						<option key={model} value={model}>
							{i18nMessages.text(modelLabels[model] ?? model)}
						</option>
					))}
					<option value="custom">
						<I18nMessage value={{ key: "lite:Ai.custom" }} />
					</option>
				</select>
			</Row>
			{selection === "custom" && (
				<Row label={i18nMessages.t("lite:Ai.customModel")} htmlFor={`${p.id}-custom`}>
					<input
						id={`${p.id}-custom`}
						type="text"
						value={p.model}
						onChange={(event) => p.onChange(event.currentTarget.value)}
					/>
				</Row>
			)}
		</>
	);
};

export const Ai: FC = () => {
	const i18nMessages = useTranslations();
	const { data: configuration } = useSuspenseQuery(aiConfigurationQueryOptions);
	const client = useQueryClient();
	const [update, setUpdate] = useState<AiConfigurationUpdate>(() =>
		configurationUpdate(configuration),
	);
	const [saved, setSaved] = useState<AiConfiguration>(configuration);
	const [dirty, setDirty] = useState(configuration.provider === "openrouter");
	const [saving, setSaving] = useState(false);
	const [resetting, setResetting] = useState(false);
	const [testing, setTesting] = useState(false);
	const [result, setResult] = useState("");
	const [error, setError] = useState<LocalizedText | null>(null);

	const change = <K extends keyof AiConfigurationUpdate>(
		key: K,
		value: AiConfigurationUpdate[K],
	) => {
		setDirty(true);
		setUpdate((current) => ({ ...current, [key]: value }));
	};

	const acceptSaved = (next: AiConfiguration) => {
		client.setQueryData(aiConfigurationQueryOptions.queryKey, next);
		setSaved(next);
		setUpdate(configurationUpdate(next));
		setDirty(false);
	};

	const save = async () => {
		setSaving(true);
		setError(null);
		try {
			acceptSaved(await window.lite.updateAiConfiguration(update));
		} catch (caught) {
			setError(errorMessageForToast(caught));
		} finally {
			setSaving(false);
		}
	};

	const test = async () => {
		setTesting(true);
		setError(null);
		setResult("");
		try {
			const response = await saveThenTest(update, acceptSaved, (token) =>
				setResult((current) => current + token),
			);
			setResult(response);
		} catch (caught) {
			setError(errorMessageForToast(caught));
		} finally {
			setTesting(false);
		}
	};

	const reset = async () => {
		if (!window.confirm(i18nMessages.t("lite:Ai.label03798a286"))) return;
		setResetting(true);
		setError(null);
		setResult("");
		try {
			acceptSaved(await window.lite.resetAiConfiguration());
		} catch (caught) {
			setError(errorMessageForToast(caught));
		} finally {
			setResetting(false);
		}
	};

	const provider = update.provider;
	const busy = saving || testing || resetting;

	return (
		<>
			<p className={classes("text-13", styles.intro)}>
				<I18nMessage value={{ key: "lite:Ai.configureTheRustAIProviderUsedByGitButler" }} />{" "}
			</p>

			<Section>
				<Row label={i18nMessages.t("lite:Ai.provider")} htmlFor="ai-provider">
					<select
						id="ai-provider"
						value={provider}
						onChange={(event) => change("provider", event.currentTarget.value as Provider)}
					>
						{Object.entries(providerLabels).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Row>

				{provider === "openai" && (
					<>
						<Row
							label={i18nMessages.t("lite:Ai.aPIKey")}
							htmlFor="openai-api-key"
							hint={
								saved.openaiHasApiKey
									? i18nMessages.t("lite:Ai.aKeyIsConfiguredLeaveBlankToKeep")
									: undefined
							}
						>
							<input
								id="openai-api-key"
								type="password"
								autoComplete="off"
								placeholder={saved.openaiHasApiKey ? "••••••••" : i18nMessages.t("lite:Ai.sk")}
								value={update.openaiApiKey ?? ""}
								onChange={(event) => change("openaiApiKey", event.currentTarget.value)}
							/>
						</Row>
						<ModelField
							id="openai-model"
							label={i18nMessages.t("lite:Ai.model")}
							model={update.openaiModel}
							presets={openAiModels}
							onChange={(model) => change("openaiModel", model)}
						/>
						<Row
							label={i18nMessages.t("lite:Ai.customEndpoint")}
							htmlFor="openai-endpoint"
							hint={i18nMessages.t("lite:Ai.optional")}
						>
							<input
								id="openai-endpoint"
								type="url"
								placeholder="https://api.openai.com/v1"
								value={update.openaiCustomEndpoint ?? ""}
								onChange={(event) => change("openaiCustomEndpoint", event.currentTarget.value)}
							/>
						</Row>
					</>
				)}

				{provider === "anthropic" && (
					<>
						<Row
							label={i18nMessages.t("lite:Ai.aPIKey")}
							htmlFor="anthropic-api-key"
							hint={
								saved.anthropicHasApiKey
									? i18nMessages.t("lite:Ai.aKeyIsConfiguredLeaveBlankToKeep")
									: undefined
							}
						>
							<input
								id="anthropic-api-key"
								type="password"
								autoComplete="off"
								placeholder={
									saved.anthropicHasApiKey ? "••••••••" : i18nMessages.t("lite:Ai.skAnt")
								}
								value={update.anthropicApiKey ?? ""}
								onChange={(event) => change("anthropicApiKey", event.currentTarget.value)}
							/>
						</Row>
						<ModelField
							id="anthropic-model"
							label={i18nMessages.t("lite:Ai.model")}
							model={update.anthropicModel}
							presets={anthropicModels}
							onChange={(model) => change("anthropicModel", model)}
						/>
					</>
				)}

				{provider === "ollama" && (
					<>
						<Row
							label={i18nMessages.t("lite:Ai.endpoint")}
							htmlFor="ollama-endpoint"
							hint={i18nMessages.t("lite:Ai.useHostPortFormat")}
						>
							<input
								id="ollama-endpoint"
								type="text"
								value={update.ollamaEndpoint}
								onChange={(event) => change("ollamaEndpoint", event.currentTarget.value)}
							/>
						</Row>
						<Row label={i18nMessages.t("lite:Ai.model")} htmlFor="ollama-model">
							<input
								id="ollama-model"
								type="text"
								value={update.ollamaModel}
								onChange={(event) => change("ollamaModel", event.currentTarget.value)}
							/>
						</Row>
					</>
				)}

				{provider === "lmstudio" && (
					<>
						<Row
							label={i18nMessages.t("lite:Ai.endpoint")}
							htmlFor="lmstudio-endpoint"
							hint={i18nMessages.t("lite:Ai.openAICompatibleBaseURL")}
						>
							<input
								id="lmstudio-endpoint"
								type="url"
								value={update.lmstudioEndpoint}
								onChange={(event) => change("lmstudioEndpoint", event.currentTarget.value)}
							/>
						</Row>
						<Row label={i18nMessages.t("lite:Ai.model")} htmlFor="lmstudio-model">
							<input
								id="lmstudio-model"
								type="text"
								value={update.lmstudioModel}
								onChange={(event) => change("lmstudioModel", event.currentTarget.value)}
							/>
						</Row>
					</>
				)}
			</Section>

			{saved.provider === "openrouter" && (
				<p className={classes("text-12", styles.warning)}>
					<I18nMessage value={{ key: "lite:Ai.openRouterIsConfiguredButIsNotSupportedIn" }} />{" "}
				</p>
			)}

			<div className={styles.actions}>
				<button
					type="button"
					className={classes(getButtonClassName({ size: "small" }), styles.reset)}
					disabled={busy}
					onClick={() => void reset()}
				>
					{resetting ? (
						<I18nMessage value={{ key: "lite:Ai.resetting" }} />
					) : (
						<I18nMessage value={{ key: "lite:Ai.resetSettings" }} />
					)}
				</button>
				<button
					type="button"
					className={getButtonClassName({ size: "small" })}
					disabled={busy || !dirty}
					onClick={() => void save()}
				>
					{saving ? (
						<I18nMessage value={{ key: "lite:Ai.saving" }} />
					) : (
						<I18nMessage value={{ key: "lite:Ai.save" }} />
					)}
				</button>
				<button
					type="button"
					className={getButtonClassName({ variant: "pop", size: "small" })}
					disabled={busy}
					onClick={() => void test()}
				>
					{testing ? (
						<I18nMessage value={{ key: "lite:Ai.aIIsResponding" }} />
					) : (
						<I18nMessage value={{ key: "lite:Ai.testConnection" }} />
					)}
				</button>
			</div>

			{(result !== "" || error !== null) && (
				<output
					aria-live="polite"
					className={classes("text-12", styles.result, error !== null && styles.resultError)}
				>
					<I18nMessage value={error ?? result} />
				</output>
			)}
		</>
	);
};
