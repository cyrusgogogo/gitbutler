#[cfg(target_os = "macos")]
use anyhow::Context as _;
#[cfg(target_os = "macos")]
use tauri::menu::AboutMetadata;
use tauri::{
    AppHandle, Emitter, EventTarget, Runtime, WebviewWindow,
    menu::{Menu, MenuEvent, MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder},
};

static SHORTCUT_EVENT: &str = "menu://shortcut";

#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Deserialize)]
pub enum MenuLocale {
    #[serde(rename = "en")]
    English,
    #[serde(rename = "zh-CN")]
    SimplifiedChinese,
}

#[cfg(test)]
mod tests {
    use super::MenuLocale;
    use but_settings::app_settings::LanguagePreference;

    #[test]
    fn native_menu_matches_the_gui_language_resolution() {
        for locale in ["zh", "zh-CN", "zh_SG", "zh-Hans-TW"] {
            assert_eq!(
                MenuLocale::resolve(LanguagePreference::System, Some(locale)),
                MenuLocale::SimplifiedChinese,
                "simplified Chinese locale {locale} uses Chinese menus"
            );
        }
        for locale in ["en-US", "zh-TW", "zh-Hant", "zh-HK", "zh-MO", "fr-FR", ""] {
            assert_eq!(
                MenuLocale::resolve(LanguagePreference::System, Some(locale)),
                MenuLocale::English,
                "unsupported locale {locale} uses English menus"
            );
        }
        assert_eq!(
            MenuLocale::resolve(LanguagePreference::English, Some("zh-CN")),
            MenuLocale::English,
            "an explicit English preference overrides the system"
        );
        assert_eq!(
            MenuLocale::resolve(LanguagePreference::SimplifiedChinese, Some("en-US")),
            MenuLocale::SimplifiedChinese,
            "an explicit Chinese preference overrides the system"
        );
        assert_eq!(
            MenuLocale::SimplifiedChinese.text("copy"),
            "复制",
            "Chinese menu labels use the bundled catalog"
        );
        assert_eq!(
            MenuLocale::English.text("copy"),
            "Copy",
            "English menu labels remain unchanged"
        );
    }
}

impl MenuLocale {
    pub fn resolve(
        preference: but_settings::app_settings::LanguagePreference,
        system: Option<&str>,
    ) -> Self {
        use but_settings::app_settings::LanguagePreference;
        match preference {
            LanguagePreference::English => Self::English,
            LanguagePreference::SimplifiedChinese => Self::SimplifiedChinese,
            LanguagePreference::System => {
                let normalized = system
                    .unwrap_or_default()
                    .replace('_', "-")
                    .to_ascii_lowercase();
                let parts: Vec<_> = normalized.split('-').collect();
                let traditional = parts.contains(&"hant")
                    || (!parts.contains(&"hans")
                        && parts.iter().any(|p| matches!(*p, "tw" | "hk" | "mo")));
                if parts.first() == Some(&"zh") && !traditional {
                    Self::SimplifiedChinese
                } else {
                    Self::English
                }
            }
        }
    }

    fn text(self, key: &str) -> &'static str {
        type Catalog = std::collections::HashMap<String, String>;
        static EN: std::sync::LazyLock<Catalog> = std::sync::LazyLock::new(|| {
            serde_json::from_str(include_str!(
                "../../../packages/i18n/src/locales/en/native.json"
            ))
            .expect("the bundled English menu catalog is valid")
        });
        static ZH: std::sync::LazyLock<Catalog> = std::sync::LazyLock::new(|| {
            serde_json::from_str(include_str!(
                "../../../packages/i18n/src/locales/zh-CN/native.json"
            ))
            .expect("the bundled Chinese menu catalog is valid")
        });
        let catalog = match self {
            Self::English => &*EN,
            Self::SimplifiedChinese => &*ZH,
        };
        catalog
            .get(key)
            .or_else(|| EN.get(key))
            .expect("menu keys exist in the catalog")
    }
}

/// Rebuild labels with the same item IDs, shortcuts and handlers.
#[tauri::command]
pub fn set_menu_locale(handle: AppHandle, locale: MenuLocale) -> Result<(), String> {
    let menu = build(&handle, locale).map_err(|error| error.to_string())?;
    handle.set_menu(menu).map_err(|error| error.to_string())?;
    Ok(())
}

pub fn build<R: Runtime>(handle: &AppHandle<R>, locale: MenuLocale) -> tauri::Result<Menu<R>> {
    let t = |key| locale.text(key);
    #[cfg(not(feature = "disable-auto-updates"))]
    let check_for_updates = MenuItemBuilder::with_id("global/update", t("update")).build(handle)?;

    #[cfg(target_os = "macos")]
    let app_name = handle
        .config()
        .product_name
        .clone()
        .context("App name not defined.")?;

    #[cfg(target_os = "macos")]
    let settings_menu = MenuItemBuilder::with_id("global/settings", t("settings"))
        .accelerator("CmdOrCtrl+,")
        .build(handle)?;

    #[cfg(target_os = "macos")]
    let mac_menu = {
        #[cfg_attr(feature = "disable-auto-updates", allow(unused_mut))]
        let mut menu = SubmenuBuilder::new(handle, app_name)
            .item(&PredefinedMenuItem::about(
                handle,
                Some(t("about")),
                Some(AboutMetadata::default()),
            )?)
            .separator()
            .item(&settings_menu);

        #[cfg(not(feature = "disable-auto-updates"))]
        {
            menu = menu.item(&check_for_updates);
        }
        menu.separator()
            .item(&PredefinedMenuItem::services(handle, Some(t("services")))?)
            .separator()
            .item(&PredefinedMenuItem::hide(handle, Some(t("hide")))?)
            .item(&PredefinedMenuItem::hide_others(
                handle,
                Some(t("hideOthers")),
            )?)
            .item(&PredefinedMenuItem::show_all(handle, Some(t("showAll")))?)
            .separator()
            .item(&PredefinedMenuItem::quit(handle, Some(t("quit")))?)
            .build()?
    };

    let file_menu = &SubmenuBuilder::new(handle, t("file"))
        .items(&[
            &MenuItemBuilder::with_id("file/add-local-repo", t("addRepository"))
                .accelerator("CmdOrCtrl+O")
                .build(handle)?,
            &MenuItemBuilder::with_id("file/clone-repo", t("cloneRepository"))
                .accelerator("CmdOrCtrl+Shift+O")
                .build(handle)?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItemBuilder::with_id("file/create-branch", t("createBranch"))
                .accelerator("CmdOrCtrl+B")
                .build(handle)?,
            &MenuItemBuilder::with_id("file/create-dependent-branch", t("createDependentBranch"))
                .accelerator("CmdOrCtrl+Shift+B")
                .build(handle)?,
            &PredefinedMenuItem::separator(handle)?,
        ])
        .build()?;

    #[cfg(target_os = "macos")]
    file_menu.append(&PredefinedMenuItem::close_window(handle, Some(t("close")))?)?;

    if cfg!(not(target_os = "macos")) {
        file_menu.append_items(&[&PredefinedMenuItem::quit(handle, Some(t("quit")))?])?;
        #[cfg(not(feature = "disable-auto-updates"))]
        file_menu.append_items(&[&check_for_updates])?;
    }

    #[cfg(not(target_os = "linux"))]
    let edit_menu = &Submenu::new(handle, t("edit"), true)?;

    #[cfg(not(target_os = "linux"))]
    {
        edit_menu.append_items(&[
            &PredefinedMenuItem::cut(handle, Some(t("cut")))?,
            &PredefinedMenuItem::copy(handle, Some(t("copy")))?,
            &PredefinedMenuItem::paste(handle, Some(t("paste")))?,
        ])?;
    }

    let view_menu = &Submenu::new(handle, t("view"), true)?;

    #[cfg(target_os = "macos")]
    view_menu.append(&PredefinedMenuItem::fullscreen(
        handle,
        Some(t("fullscreen")),
    )?)?;
    view_menu.append_items(&[
        &MenuItemBuilder::with_id("view/switch-theme", t("theme"))
            .accelerator("CmdOrCtrl+T")
            .build(handle)?,
        &MenuItemBuilder::with_id("view/toggle-sidebar", t("unassigned"))
            .accelerator("CmdOrCtrl+\\")
            .build(handle)?,
        &PredefinedMenuItem::separator(handle)?,
        &MenuItemBuilder::with_id("view/zoom-in", t("zoomIn"))
            .accelerator("CmdOrCtrl+=")
            .build(handle)?,
        &MenuItemBuilder::with_id("view/zoom-out", t("zoomOut"))
            .accelerator("CmdOrCtrl+-")
            .build(handle)?,
        &MenuItemBuilder::with_id("view/zoom-reset", t("zoomReset"))
            .accelerator("CmdOrCtrl+0")
            .build(handle)?,
        &PredefinedMenuItem::separator(handle)?,
    ])?;

    #[cfg(any(debug_assertions, feature = "devtools"))]
    view_menu.append_items(&[
        &MenuItemBuilder::with_id("view/devtools", t("devtools"))
            .accelerator("CmdOrCtrl+Shift+C")
            .build(handle)?,
        &MenuItemBuilder::with_id("view/reload", t("reload"))
            .accelerator("CmdOrCtrl+R")
            .build(handle)?,
    ])?;

    let mut project_menu_builder = SubmenuBuilder::new(handle, t("project"))
        .item(
            &MenuItemBuilder::with_id("project/history", t("history"))
                .accelerator("CmdOrCtrl+Shift+H")
                .build(handle)?,
        )
        .separator()
        .text("project/open-in-vscode", t("editor"))
        .text("project/open-in-terminal", t("terminal"));

    #[cfg(target_os = "macos")]
    {
        project_menu_builder = project_menu_builder.text("project/show-in-finder", t("finder"));
    }

    #[cfg(target_os = "windows")]
    {
        project_menu_builder = project_menu_builder.text("project/show-in-finder", t("explorer"));
    }

    #[cfg(target_os = "linux")]
    {
        project_menu_builder =
            project_menu_builder.text("project/show-in-finder", t("fileManager"));
    }

    let project_menu = &project_menu_builder
        .separator()
        .text("project/settings", t("projectSettings"))
        .build()?;

    #[cfg(target_os = "macos")]
    let window_menu = &SubmenuBuilder::new(handle, t("window"))
        .items(&[
            &PredefinedMenuItem::minimize(handle, Some(t("minimize")))?,
            &PredefinedMenuItem::maximize(handle, Some(t("maximize")))?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::close_window(handle, Some(t("close")))?,
        ])
        .build()?;

    let help_menu = SubmenuBuilder::new(handle, t("help"))
        .text("help/documentation", t("documentation"))
        .text("help/debugging-guide", t("debugging"))
        .text("help/github", t("source"))
        .text("help/release-notes", t("releaseNotes"))
        .separator()
        .text("help/share-debug-info", t("shareDebug"))
        .text("help/report-issue", t("issue"))
        .separator()
        .text("help/open-logs-folder", t("logs"))
        .text("help/open-config-folder", t("config"))
        .text("help/open-cache-folder", t("cache"))
        .separator()
        .text("help/discord", "Discord")
        .text("help/youtube", "YouTube")
        .text("help/bluesky", "Bluesky")
        .text("help/x", "X")
        .separator()
        .item(
            &MenuItemBuilder::with_id(
                "help/version",
                t("version").replace("{{version}}", &handle.package_info().version.to_string()),
            )
            .enabled(false)
            .build(handle)?,
        )
        .build()?;

    Menu::with_items(
        handle,
        &[
            #[cfg(target_os = "macos")]
            &mac_menu,
            file_menu,
            #[cfg(not(target_os = "linux"))]
            edit_menu,
            view_menu,
            project_menu,
            #[cfg(target_os = "macos")]
            window_menu,
            &help_menu,
        ],
    )
}

pub fn handle_event(webview: &WebviewWindow, event: &MenuEvent) {
    if event.id() == "file/add-local-repo" {
        emit(webview, "menu://shortcut", "add-local-repo");
        return;
    }

    if event.id() == "file/clone-repo" {
        emit(webview, SHORTCUT_EVENT, "clone-repo");
        return;
    }

    if event.id() == "file/create-branch" {
        emit(webview, SHORTCUT_EVENT, "create-branch");
        return;
    }

    if event.id() == "file/create-dependent-branch" {
        emit(webview, SHORTCUT_EVENT, "create-dependent-branch");
        return;
    }

    #[cfg(any(debug_assertions, feature = "devtools"))]
    {
        if event.id() == "view/devtools" {
            if webview.is_devtools_open() {
                webview.close_devtools();
            } else {
                webview.open_devtools();
            }
            return;
        }
    }

    if event.id() == "view/switch-theme" {
        emit(webview, SHORTCUT_EVENT, "switch-theme");
        return;
    }

    if event.id() == "view/toggle-sidebar" {
        emit(webview, SHORTCUT_EVENT, "toggle-sidebar");
        return;
    }

    if event.id() == "view/reload" {
        emit(webview, SHORTCUT_EVENT, "reload");
        return;
    }

    if event.id() == "view/zoom-in" {
        emit(webview, SHORTCUT_EVENT, "zoom-in");
        return;
    }

    if event.id() == "view/zoom-out" {
        emit(webview, SHORTCUT_EVENT, "zoom-out");
        return;
    }

    if event.id() == "view/zoom-reset" {
        emit(webview, SHORTCUT_EVENT, "zoom-reset");
        return;
    }

    if event.id() == "help/share-debug-info" {
        emit(webview, SHORTCUT_EVENT, "share-debug-info");
        return;
    }

    if event.id() == "project/history" {
        emit(webview, SHORTCUT_EVENT, "history");
        return;
    }

    if event.id() == "project/open-in-vscode" {
        emit(webview, SHORTCUT_EVENT, "open-in-vscode");
        return;
    }

    if event.id() == "project/open-in-terminal" {
        emit(webview, SHORTCUT_EVENT, "open-in-terminal");
        return;
    }

    if event.id() == "project/show-in-finder" {
        emit(webview, SHORTCUT_EVENT, "show-in-finder");
        return;
    }

    if event.id() == "project/settings" {
        emit(webview, SHORTCUT_EVENT, "project-settings");
        return;
    }

    if event.id() == "global/settings" {
        emit(webview, SHORTCUT_EVENT, "global-settings");
        return;
    }

    if event.id() == "global/update" {
        emit(webview, SHORTCUT_EVENT, "update");
        return;
    }

    if event.id() == "help/open-logs-folder" {
        if let Err(err) = crate::debug::open_logs_folder() {
            tracing::error!(error = ?err, "failed to open logs folder");
        }
        return;
    }

    if event.id() == "help/open-config-folder" {
        if let Err(err) = crate::debug::open_config_folder() {
            tracing::error!(error = ?err, "failed to open config folder");
        }
        return;
    }

    if event.id() == "help/open-cache-folder" {
        if let Err(err) = crate::debug::open_cache_folder() {
            tracing::error!(error = ?err, "failed to open cache folder");
        }
        return;
    }

    'open_link: {
        let result = match event.id().0.as_str() {
            "help/documentation" => open::that("https://docs.gitbutler.com"),
            "help/debugging-guide" => {
                open::that("https://docs.gitbutler.com/development/debugging")
            }
            "help/github" => open::that("https://github.com/gitbutlerapp/gitbutler"),
            "help/release-notes" => {
                open::that("https://github.com/gitbutlerapp/gitbutler/releases")
            }
            "help/report-issue" => {
                open::that("https://github.com/gitbutlerapp/gitbutler/issues/new/choose")
            }
            "help/discord" => open::that("https://discord.com/invite/MmFkmaJ42D"),
            "help/youtube" => open::that("https://www.youtube.com/@gitbutlerapp"),
            "help/bluesky" => open::that("https://bsky.app/profile/gitbutler.com"),
            "help/x" => open::that("https://x.com/gitbutler"),
            _ => break 'open_link,
        };

        if let Err(err) = result {
            tracing::error!(error = ?err, "failed to open url for {}", event.id().0);
        }

        return;
    }

    tracing::error!("unhandled 'help' menu event: {}", event.id().0);
}

fn emit<R: Runtime>(window: &WebviewWindow<R>, event: &str, shortcut: &str) {
    if let Err(err) = window.emit_to(EventTarget::window(window.label()), event, shortcut) {
        tracing::error!(error = ?err, "failed to emit event");
    }
}
