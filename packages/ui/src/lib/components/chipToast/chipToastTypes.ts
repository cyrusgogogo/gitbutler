export type ChipToastType = "info" | "success" | "warning" | "danger";

export interface ChipToastButtonConfig {
	label: LocalizedText;
	action: () => void;
}

export interface ChipToastData {
	id: string;
	message: LocalizedText;
	type: ChipToastType;
	customButton?: ChipToastButtonConfig;
	showDismiss?: boolean;
}

export interface ChipToastOptions {
	type?: ChipToastType;
	customButton?: ChipToastButtonConfig;
	showDismiss?: boolean;
}
import type { LocalizedText } from "@gitbutler/i18n";
