#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CredentialsKeyOption {
    #[serde(alias = "butlerAPI")]
    BringYourOwn,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legacy_cloud_option_uses_own_credentials() {
        assert_eq!(
            CredentialsKeyOption::from_git_config_value("butlerAPI"),
            Some(CredentialsKeyOption::BringYourOwn),
            "legacy cloud settings must not enable the retired official proxy"
        );
        assert_eq!(
            serde_json::from_str::<CredentialsKeyOption>("\"butlerAPI\"").unwrap(),
            CredentialsKeyOption::BringYourOwn,
            "legacy serialized settings must remain readable as own-key settings"
        );
    }

    #[test]
    fn defaults_use_own_credentials() {
        let config = crate::AiConfiguration::default();
        assert_eq!(
            config.openai.key_option,
            CredentialsKeyOption::BringYourOwn,
            "OpenAI requires the user's own key"
        );
        assert_eq!(
            config.anthropic.key_option,
            CredentialsKeyOption::BringYourOwn,
            "Anthropic requires the user's own key"
        );
    }
}

impl CredentialsKeyOption {
    pub fn from_git_config_value(s: &str) -> Option<Self> {
        match s {
            "bringYourOwn" | "butlerAPI" => Some(CredentialsKeyOption::BringYourOwn),
            _ => None,
        }
    }

    pub fn as_git_config_value(self) -> &'static str {
        match self {
            CredentialsKeyOption::BringYourOwn => "bringYourOwn",
        }
    }
}
