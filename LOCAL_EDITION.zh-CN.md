# GitButler 独立本地版：启动与代理

本次调整适用于 Desktop（Tauri）和 Lite（Electron）。两者保留英文、简体中文、跟随系统，以及原有 Git 操作。

## 功能范围

已移除 GitButler 账号登录、官方访问令牌、组织页面、官方云端 AI 代理、Discord/社区/反馈入口、向团队分享项目或日志、官方文件上传、遥测和官方自动更新。旧的 `butlerAPI` 配置按使用自己的 AI 密钥处理，不再请求官方 AI 代理。

保留 GitHub/GitLab/Bitbucket 仓库认证、PR/MR、自己的 AI 密钥、自定义 OpenAI 兼容地址、Ollama/LM Studio，以及本地日志。帮助文档和教程链接仍可手动打开。原有账号文件和凭据未删除，已退出运行路径。

这次没有改造独立的 Web 官网，也没有全面移除独立 `but` CLI 的官方功能；共享 AI 配置及 SDK 类型已随两个桌面客户端同步调整。

## 从源码启动

在 PowerShell 中进入源码目录。需要 Node.js 24 或更新版本、pnpm 10.20.0、项目指定的 Rust 工具链，以及原有 Windows 原生编译环境。

```powershell
Set-Location D:\code\gitbutler
git branch --show-current
node --version
pnpm --version
```

使用包含本地版改动的 `master`。不要在正在运行的 GitButler 中把 `D:\code\gitbutler` 本身切回旧的 `gitbutler/workspace`；本次“Lite 仍是英文”就是启动源码回到旧工作区分支，该分支没有中文实现。测试 Git 操作时使用另一个仓库。

第一次安装依赖，或依赖发生变化后执行：

```powershell
pnpm install --frozen-lockfile
```

启动 Desktop：

```powershell
pnpm dev:desktop
```

启动 Lite 前，先生成完整的原生 SDK 和类型；然后启动应用：

```powershell
pnpm build:sdk
pnpm dev:lite
```

源码启动终端保持运行，停止时按 `Ctrl+C`。Rust、SDK 或 Electron 主进程变化后应完整重启。界面可在“设置 → 常规 → 语言”选择“简体中文”；首次启动默认跟随系统。

## Git 网络代理

Desktop 的 Git 操作由子进程执行，会继承启动进程环境。Windows“系统代理已开启”不等于当前 Git 子进程已获得代理配置。Git 的 `http.proxy` 可以覆盖 `http_proxy`、`https_proxy`、`all_proxy` 环境变量，详见 [Git 官方配置文档](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httpproxy)。

本机排查时，系统代理是 `127.0.0.1:7897`；目标仓库没有 `http.proxy` 配置。对代码服务器的无认证 HEAD 探测中，直连和显式代理均返回 HTTP 302。这只能证明当时能连通服务器，不等于仓库认证或 `fetch` 已通过，也不能证明此前的 443 连接超时完全由代理造成。

可以在启动应用的同一个 PowerShell 中设置本次进程使用的代理：

```powershell
$env:HTTP_PROXY = 'http://127.0.0.1:7897'
$env:HTTPS_PROXY = 'http://127.0.0.1:7897'
pnpm dev:desktop
```

Lite 同样适用，将最后一行替换为 `pnpm dev:lite`。这些设置不写入 Windows 全局环境；关闭终端后不影响之后新开的终端。

如果只想让目标仓库的 HTTPS Git 请求使用代理，可自行执行：

```powershell
git -C D:\code\agent-runner-test config --local http.proxy http://127.0.0.1:7897
git -C D:\code\agent-runner-test config --show-origin --get-urlmatch http.proxy https://code.huilianyi.com/rui.xi/agent-runner-test.git
```

撤销刚才添加的仓库代理配置：

```powershell
git -C D:\code\agent-runner-test config --local --unset http.proxy
```

本次排查没有修改系统代理、全局 Git 配置或目标仓库代理配置。应用重启后再进行实际拉取，若仍失败，应保留完整错误以区分连接、证书和认证问题。

## 日志修复

- 首次启动没有 `settings.json` 时正常使用默认设置，不再打印文件缺失警告；配置损坏或权限错误仍保留提示。
- 未识别代码托管平台或平台不支持仓库元信息时，不再反复请求 `getRepoInfo`。支持的平台发生真实请求错误时仍报告错误。
- 移除了开发启动时自动安装的 React/Redux 浏览器扩展，避免相关过时 API 和扩展权限警告；应用调试工具仍可使用。
- `programs.json` 缺失表示尚未配置自定义编辑器/终端。主动关闭 Electron 后开发服务停止，是进程退出行为。

## 本次验证

- Desktop：56 个测试文件、422 项测试通过；类型检查、前端构建和 Tauri 原生构建通过。
- Lite：界面单元测试 336 项、主进程测试 12 项通过；类型检查通过。
- Rust：`but-llm` 8 项、CLI AI 配置 8 项测试通过；SDK 原生模块和生成类型构建通过。
- 格式、Oxlint、Knip、Desktop 改动文件 ESLint 和翻译目录检查通过。
- Windows Lite 实际界面：语言、首次启动、本地版设置及旧 AI 配置回归共 7 项通过。测试命令如下：

```powershell
$env:PATH = 'C:\Program Files\Git\bin;' + $env:PATH
pnpm -F @gitbutler/lite exec playwright test --config ./e2e/playwright.config.ts language.spec.ts local-edition.spec.ts start.spec.ts --workers=1 --headed
```

- Windows 原生 Desktop：实际打开设置，验证英中文切换、官方入口移除、自定义 AI 表单可见、旧账号命令不可调用；该检查期间未观察到官方服务请求或页面错误。

完整 Lite E2E 曾因 Windows 调用了 WSL 的 Bash 而使仓库夹具初始化失败；修正测试进程 PATH 后，上述相关用例通过。未将整个 E2E 套件记为通过。未验证 macOS/Linux 原生窗口、真实 AI 服务调用、目标私有仓库的认证拉取、安装包或远程发布。`cargo machete` 未安装，未完成该工具检查。

所有原生测试使用临时应用目录和隔离的 Git 凭据助手，禁用交互式凭据提示，没有读取或写入真实账号密钥。测试窗口与开发服务已关闭。
