import { normalizePreference, type LanguagePreference } from "./index.js";
import { useTranslations } from "./react.js";
import { useState } from "react";

export function LanguageSelect({
	value,
	onChange,
	host = false,
}: {
	value: LanguagePreference;
	onChange: (value: LanguagePreference) => Promise<boolean> | boolean;
	host?: boolean;
}) {
	const { t } = useTranslations();
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<"error" | "session">();
	return (
		<div>
			<label style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
				<span>{t("common:language.label")}</span>
				<select
					value={value}
					disabled={saving}
					onChange={async (event) => {
						const next = normalizePreference(event.currentTarget.value);
						setSaving(true);
						setNotice(undefined);
						try {
							if (!(await onChange(next))) setNotice("session");
						} catch (error) {
							console.error(error);
							setNotice("error");
						} finally {
							setSaving(false);
						}
					}}
				>
					<option value="system">
						{t(host ? "common:language.host" : "common:language.system")}
					</option>
					<option value="en">English</option>
					<option value="zh-CN">简体中文</option>
				</select>
			</label>
			{saving && <span role="status">{t("common:language.saving")}</span>}
			{notice && (
				<span role="status">
					{t(notice === "error" ? "common:language.saveError" : "common:language.sessionOnly")}
				</span>
			)}
		</div>
	);
}
