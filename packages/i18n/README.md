# GitButler 界面多语言

此包为 Desktop、Lite、Web 和 MCP 卡片提供英文与简体中文。每个入口创建自己的运行时，只导入该入口所需的词条；切换语言不重新加载页面。

## 语言选择

| 入口    | 设置位置                                 | 保存位置                               |
| ------- | ---------------------------------------- | -------------------------------------- |
| Desktop | 首次启动页、欢迎页及设置 → 常规 → 语言   | `AppSettings.ui.language`              |
| Lite    | 欢迎页及设置 → 应用 → 常规 → 语言        | Electron `settings.json` 的 `language` |
| Web     | 公共导航、移动菜单及应用导航中的语言选择 | `localStorage`，仅当前浏览器           |
| MCP     | 工作区与审查卡片顶部                     | MCP 独立的 `localStorage` 偏好         |

可选值为 `system`、`en`、`zh-CN`。默认跟随系统；MCP 优先采用宿主传入的 locale，没有时使用浏览器语言。只有简体中文语言标记映射为中文，其他语言回退到英文。手动选择优先于系统或宿主。各入口独立保存，不同步到账号。

Desktop/Lite 保存失败时恢复原选择并提示错误；Web/MCP 的环境拒绝保存时仍可在本次会话中切换，并显示未持久化提示。操作系统自己绘制的文件对话框等仍由系统决定语言。

## 文案边界

应用自己的按钮、说明、验证消息、错误处理建议、通知、无障碍标签和数量文案放入词条。分支名称、路径、提交说明、代码、Git/Rust/远程服务原始错误、AI 提示词与输出、博客正文和外部发行说明保留原内容。CLI/TUI 的终端输出不受此包影响；Rust 只复用原生菜单和 MCP 图形回退页面所需的词条。

日志和遥测继续使用英文诊断。已知的应用错误可用 `i18n.error()`，它同时保留英文 `Error.message` 和供界面延迟翻译的 `localized` 消息。不要把任意后端错误当作翻译键。

## 添加词条

1. 在 `src/locales/en/<namespace>.json` 与 `src/locales/zh-CN/<namespace>.json` 中同时添加词条。命名采用所属功能加含义，如 `commit.emptyMessage`。
2. 保持整句话为一个词条，用 `{{name}}` 插入原始数据。数量使用数值 `count` 和 `_one` / `_other`，必要时增加 `_zero`；两种语言保持相同键集合。
3. 带链接、强调或代码的整句使用 `RichMessage` 与命名插槽，真实元素、事件和链接地址保留在代码中。词条不是可执行 HTML。
4. 在显示位置读取翻译。已入队的通知、静态菜单定义和异步状态保存 `message()` 返回的描述对象，避免把当时语言的字符串存入长期状态。
5. 运行下列校验，再运行修改入口的类型检查与测试。

```sh
pnpm -F @gitbutler/i18n check
pnpm -F @gitbutler/i18n test
pnpm -F @gitbutler/i18n package
```

`MessageKey` 从英文 JSON 推导，不会把其他入口的词条带入运行时。`message()`、`t()` 和 `error()` 的键受类型检查；静态 JSON 描述及源码字面量另由 `scripts/check-catalogs.mjs` 检查。校验还覆盖键集合、插值变量、富文本插槽和复数形式。

### React

```tsx
const { t } = useTranslations();
return <button>{t("common:save")}</button>;

// 创建通知时保存描述，在 Toast 的 React 树中显示。
const queued = message("common:save");
return <Message value={queued} />;
```

根节点使用稳定的 `<I18nProvider i18n={runtime}>`。翻译订阅仅在语言改变时更新；需要 `useMemo` 的计算应包含所用的翻译依赖。不要以语言为 React `key`，也不要在切换时重新创建路由、编辑器或业务状态。

`RichMessage` 是同步的客户端组件。递归渲染函数返回 `ReactNode[]`，不要改为异步函数；单独的 `ReactNode` 类型也包含 Promise，可能让自动修正规则错误地加入 `async`。

### Svelte

```svelte
<script lang="ts">
	import { useTranslations } from "@gitbutler/i18n/svelte";
	const translations = useTranslations();
</script>

<button>{$translations.t("common:save")}</button>
```

根组件先调用 `provideI18n(runtime)`。使用 `@gitbutler/ui/i18n/Message.svelte` 或 `RichMessage.svelte` 显示描述；富文本插槽用 Svelte snippet 提供。依赖语言的计算放在 `$derived` 中，不要缓存成初始化常量。

## 约定用词

| 英文                    | 中文            |
| ----------------------- | --------------- |
| repository              | 仓库            |
| workspace               | 工作区          |
| worktree                | 工作树          |
| stack                   | 堆叠            |
| branch                  | 分支            |
| commit / commit message | 提交 / 提交说明 |
| target branch           | 目标分支        |
| remote tracking branch  | 远程跟踪分支    |
| rebase                  | 变基            |
| squash                  | 压缩提交        |
| cherry-pick             | 拣选            |
| absorb                  | 吸收更改        |
| unapply                 | 取消应用        |
| land                    | 合入            |
| pull request            | 拉取请求（PR）  |
| hunk                    | 差异块          |

必要时首次出现保留英文辅助识别；Git 引用、协议字段和快捷键组合保持原样。

## 构建与维护

通过 Turbo 构建会先生成依赖的 `dist`。直接执行某入口的构建前，先执行语言包的 `package`，Desktop/Web 还需要共享 UI 与 shared 包。发布工作流中的 MCP 构建使用 Turbo，确保词条依赖已构建。

原生菜单通过 Rust `include_str!` 读取 `native.json`。MCP 未构建时的回退页面直接嵌入 `common.json` 和 `mcp.json`，因此 Rust-only 构建也能选择语言。MCP 单文件界面改动需同步增加 `crates/but/src/command/mcp/mod.rs` 的资源 URI 版本。

Lite 的 Electron 应用菜单与编辑菜单也使用 `native.json`。应用菜单按已有角色更新文字，保留命令和快捷键，切回英文时恢复 Electron 原有的各平台标签。

检查语言切换时应同时观察已有草稿、光标位置、选中文件、路由、排队通知、日期和原生菜单。中文字体使用系统自带的中文字体回退，不额外下载字体。浏览器或组件测试不能替代对应操作系统上的原生窗口验证。

本次实现的实际检查结果及未通过项见 [验证报告](./VERIFICATION.md)。
