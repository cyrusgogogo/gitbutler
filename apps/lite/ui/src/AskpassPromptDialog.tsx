import { message, type LocalizedText } from "@gitbutler/i18n";
import { Message as I18nMessage, useTranslations } from "@gitbutler/i18n/react";
import { Dialog } from "@base-ui/react";
import { useEffect, useRef, useState } from "react";
import type { FC, SyntheticEvent } from "react";
import { getButtonClassName } from "#ui/components/Button.tsx";
import { Modal } from "#ui/components/Popup.tsx";
import styles from "./AskpassPromptDialog.module.css";
import type { AskpassPromptEvent } from "@gitbutler/but-sdk";

const secretPromptPattern = /\b(passphrase|password|token|secret|credential)\b/i;

const isSecretPrompt = (prompt: string): boolean => secretPromptPattern.test(prompt);

function getDescription(prompt: AskpassPromptEvent): LocalizedText {
	switch (prompt.context.type) {
		case "Push":
			return message("lite:credentials.push", { prompt: prompt.prompt });
		case "Fetch":
			return message("lite:credentials.fetch", { prompt: prompt.prompt });
		case "SignedCommit":
			return message("lite:credentials.signedcommit", { prompt: prompt.prompt });
		case "Clone":
			return message("lite:credentials.clone", { prompt: prompt.prompt });
	}
}

export const AskpassPromptDialog: FC = () => {
	const i18nMessages = useTranslations();
	const [prompts, setPrompts] = useState<Array<AskpassPromptEvent>>([]);
	const [response, setResponse] = useState<{ promptId: string; value: string } | null>(null);
	const [submitError, setSubmitError] = useState<{ promptId: string; message: string } | null>(
		null,
	);
	const [submitting, setSubmitting] = useState(false);
	const respondingPromptId = useRef<string | null>(null);
	const currentPrompt = prompts[0];
	const currentResponse =
		currentPrompt !== undefined && response?.promptId === currentPrompt.id ? response.value : "";
	const currentSubmitError =
		currentPrompt !== undefined && submitError?.promptId === currentPrompt.id
			? submitError.message
			: null;

	useEffect(
		() =>
			window.lite.onAskpassPrompt((event) => {
				setPrompts((current) => [...current, event]);
			}),
		[],
	);

	const respond = async (prompt: AskpassPromptEvent, value: string | null) => {
		if (respondingPromptId.current === prompt.id) return;

		respondingPromptId.current = prompt.id;
		setSubmitting(true);

		try {
			await window.lite.askpassSubmitPromptResponse({ id: prompt.id, response: value });
			setPrompts((current) => current.filter((candidate) => candidate.id !== prompt.id));
			setSubmitError(null);
		} catch (err) {
			respondingPromptId.current = null;
			setSubmitError({
				promptId: prompt.id,
				message: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setSubmitting(false);
		}
	};

	const submit = (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (currentPrompt) void respond(currentPrompt, currentResponse);
	};

	return (
		<Modal
			alert
			size="small"
			open={currentPrompt !== undefined}
			onOpenChange={(open) => {
				if (!open && currentPrompt && !submitting) void respond(currentPrompt, null);
			}}
		>
			{currentPrompt !== undefined && (
				<form className={styles.form} onSubmit={submit}>
					<Dialog.Title>
						<I18nMessage value={{ key: "lite:AskpassPromptDialog.gitCredentialsRequired" }} />
					</Dialog.Title>
					<Dialog.Description className={styles.prompt}>
						<I18nMessage value={getDescription(currentPrompt)} />
					</Dialog.Description>
					<input
						className={styles.input}
						type={isSecretPrompt(currentPrompt.prompt) ? "password" : "text"}
						value={currentResponse}
						onChange={(event) =>
							setResponse({ promptId: currentPrompt.id, value: event.target.value })
						}
						disabled={submitting}
						aria-label={i18nMessages.t("lite:AskpassPromptDialog.credentialResponse")}
					/>
					{currentSubmitError !== null && (
						<p className={styles.error}>
							<I18nMessage
								value={{
									key: "lite:AskpassPromptDialog.failedToSendResponseValue",
									values: { currentSubmitError: String(currentSubmitError) },
								}}
							/>
						</p>
					)}
					<div className={styles.actions}>
						<button
							type="button"
							className={getButtonClassName({ variant: "ghost" })}
							disabled={submitting}
							onClick={() => void respond(currentPrompt, null)}
						>
							<I18nMessage value={{ key: "lite:AskpassPromptDialog.cancel" }} />
						</button>
						<button
							type="submit"
							className={getButtonClassName({ variant: "pop" })}
							disabled={submitting}
						>
							<I18nMessage value={{ key: "lite:AskpassPromptDialog.continue" }} />
						</button>
					</div>
				</form>
			)}
		</Modal>
	);
};
