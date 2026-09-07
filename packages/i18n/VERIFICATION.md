# 中英文界面实现验证

验证日期：2026-09-07。环境：Windows、Rust 1.96、Node.js 24、Electron 44、Chromium / WebView2。本报告区分源码检查、隔离环境中的界面验证与真实外部服务验证。

## 实现范围

Desktop、Lite、Web、MCP 工作区与审查卡片共用 `@gitbutler/i18n`，各自创建独立运行时。英文与简体中文共 3,258 组词条，分为 `common`、`ui`、`shared`、`desktop`、`lite`、`web`、`mcp`、`native` 八个命名空间。

- 默认跟随系统，支持手动选择 English / 简体中文；MCP 优先跟随宿主语言。
- 无需重新载入页面即可切换语言，各入口独立保存偏好。
- 队列通知、应用错误和静态菜单使用消息描述对象，显示时翻译；保留英文诊断及后端原始错误。
- 原生菜单、无障碍标签、日期、数量、空状态和应用内说明均接入词条。用户内容、Git 引用、路径、代码、AI 提示词与输出、外部文章和发行说明保留原文。
- 类型检查覆盖消息键，目录检查覆盖中英文键集合、插值参数、富文本插槽和复数形式。CI 已加入新语言包的构建顺序及变更触发路径。
- Rust 的设置字段及 SDK 声明同步更新；CLI/TUI 终端输出不变。MCP 的 Rust 回退页面单独支持语言选择，资源 URI 已更新。

## 已通过的自动检查

| 检查                                                              | 结果                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| `pnpm -F @gitbutler/i18n check`                                   | 3,258 组词条校验及 TypeScript 检查通过                  |
| `pnpm -F @gitbutler/i18n test`                                    | 25 项通过                                               |
| `pnpm -F @gitbutler/desktop test`                                 | 472 项通过                                              |
| `pnpm -F @gitbutler/lite test`                                    | UI 336 项、harness 42 项通过                            |
| `pnpm -F @gitbutler/ui test`                                      | 307 项通过，包含 Chromium 中的 Storybook 组件测试       |
| `pnpm test:ct`                                                    | Chromium / WebKit 组件测试 203 项通过，1 项按原配置跳过 |
| `pnpm -F @gitbutler/shared test`                                  | 24 项通过                                               |
| `pnpm -F @gitbutler/web test`                                     | 15 项通过                                               |
| Web `playwright test language.spec.ts --reporter=list`            | 2 项登录页语言与草稿保留检查通过                        |
| Lite `test:e2e --workers=1 --grep 'switches labels and restores'` | 应用菜单切换、命令与快捷键保留、英文恢复检查通过        |
| `pnpm -F @gitbutler/but-mcp-app test`                             | Rust 回退页面的 2 项脚本测试通过                        |
| `pnpm -F @gitbutler/but-mcp-app test:browser`                     | 6 项真实单文件 HTML 浏览器测试通过                      |
| `cargo test -p but-settings gui_language`                         | 持久化、其他设置保留及未知语言兼容，共 2 项通过         |
| `cargo test -p gitbutler-tauri --lib menu::tests`                 | 语言解析与原生菜单词条测试通过                          |

Desktop、Lite、Web、MCP 的类型检查通过。Desktop 生产前端构建、Lite 前端与 Electron 构建、两个 MCP 单文件构建、Tauri 原生构建及嵌入 MCP 的 `but` 构建通过。

执行了仓库要求的 `pnpm oxlint:fix`、`pnpm knip:prod`、`pnpm knip:non-prod`、`pnpm exec oxfmt apps/lite`、`pnpm exec prettier --write apps/lite`，以及修改文件的 ESLint、Prettier、Rust 格式检查和 `git diff --check`。Knip 留有原配置的两条提示，不影响退出状态。

Desktop 类型检查前使用 `pnpm -F @gitbutler/desktop exec svelte-kit sync --mode development` 生成与开发配置匹配的环境声明；生产构建生成的环境声明不能直接作为开发类型检查的前置产物。

## 实际界面验证

### Windows Desktop

使用隔离的应用数据目录启动实际 Tauri / WebView2 程序。首次启动页面从系统中文切换为英文，再切回中文，路由不变，设置文件写入 `ui.language = "zh-CN"`。重新启动后仍为中文。

通过 Windows 菜单 API 读取实际菜单，确认文件、编辑、视图、项目、帮助菜单及子项同步切换，原快捷键保持不变。检查了中文字体回退和放大后的文字显示。没有执行真实仓库的工作区切换或提交操作。

### Windows Lite

在临时仓库中创建文件并勾选，填写混合中英文的提交草稿，然后切换为中文。实际断言确认草稿、文件勾选和路由保留，设置文件保存中文，原始文件内容不变。模拟设置写入失败时，界面保留原语言并显示保存失败提示。

另外使用保存后的临时配置重新启动 Electron，确认中文偏好从文件恢复。检查了中文设置页、工作区、200% 缩放和深色样式。独立重启检查结束时强制终止测试进程；这项结果不代表常规退出流程通过，常规退出的超时另见下文。

应用菜单另有独立端到端回归：实际 Electron 程序从英文切到中文，再切回英文，菜单角色、命令 ID 和快捷键保持一致，英文文字完整恢复，该用例连同常规退出通过。另检查了保存中文配置后重新启动时的全部应用菜单标签。

### Web

Chromium 登录页检查覆盖中英文切换后邮箱、密码、路由保留，刷新后偏好恢复，以及另一个标签页切换语言后当前草稿保留。检查了 390px 宽度下的中英文登录表单。未向真实账号发送登录请求。

### MCP

浏览器加载实际构建的两个单文件卡片，模拟宿主初始化与语言变更。检查了手动选择优先于宿主、返回跟随宿主、刷新恢复选择，以及存储被禁用时仍可在本次会话切换并显示提示。

工作区和审查数据检查覆盖中文内容、360px 窄卡片和深色主题；仓库名、分支名、审查标题不随语言变化。包含脚本标签的原始错误继续以文本显示。回退页面另用实际脚本验证宿主消息来源和偏好保存失败。

## 未通过或未覆盖的检查

1. **Lite Windows 完整端到端套件未全量通过。** 已执行 `pnpm -F @gitbutler/lite test:e2e`，并以 Git Bash、已构建的 `but.exe` 和单 worker 可见窗口重跑。发现开发者工具扩展下载导致的启动等待，以及多项测试在 `electronApp.close()` 时超时；部分交互也有超时。语言切换用例的业务断言已完成，但其常规退出曾超时，不能计为整项通过。已有断言未删除、跳过或放宽。
2. **`cargo test -p but-settings` 全量套件未通过。** 34 项通过，7 项原有 `legacy_settings::maybe_persist_overrides` 测试报 Windows `os error 5`（拒绝访问）。这些测试使用仍然打开的 `NamedTempFile`，失败涉及旧配置文件写入；本次未修改该模块。新增的两项语言设置测试单独通过。
3. **Web 发布打包未完成。** Vite 客户端与服务端编译通过，Vercel 适配器在 Windows 创建符号链接时报 `EPERM`。未修改系统权限或改换部署适配器。尚未完成实际 Vercel 部署验证。
4. 未运行 macOS / Linux 的原生窗口和菜单验证，也未运行线上账号、远程托管服务或真实 MCP 宿主的完整业务操作。更新的 GitHub Actions 工作流尚未在远端执行。

## 复查入口

- 词条与使用方式：[README](./README.md)。
- 本地详细日志与截图在仓库忽略目录 `target/i18n-work/`；Playwright 截图在相应包的 `test-results/`。
- Web 浏览器检查：`pnpm -F @gitbutler/web exec playwright test language.spec.ts --reporter=list`。
- Lite 语言检查：`pnpm -F @gitbutler/lite test:e2e --headed --workers=1 language.spec.ts`。Windows 需在当前进程的 `PATH` 前加入 Git Bash，并将 `BUT` 指向构建后的 `target/debug/but.exe`。
- 直接运行应用构建前先执行 `pnpm -F @gitbutler/i18n package`；Desktop/Web 还需完整执行 `pnpm -F @gitbutler/ui package`，其中包含样式产物。
