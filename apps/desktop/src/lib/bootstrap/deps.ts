import {
	PromptService as AIPromptService,
	PROMPT_SERVICE as AI_PROMPT_SERVICE,
} from "$lib/ai/aiPromptService";
import { AIService, AI_SERVICE } from "$lib/ai/service";
import { type IBackend } from "$lib/backend";
import { BACKEND } from "$lib/backend";
import ClipboardService, { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
import URLService, { URL_SERVICE } from "$lib/backend/url";
import BaseBranchService, { BASE_BRANCH_SERVICE } from "$lib/baseBranch/baseBranchService.svelte";
import { BranchService, BRANCH_SERVICE } from "$lib/branches/branchService.svelte";
import CLIManager, { CLI_MANAGER } from "$lib/config/cli";
import { GIT_CONFIG_SERVICE, GitConfigService } from "$lib/config/gitConfigService";
import DependencyService, { DEPENDENCY_SERVICE } from "$lib/dependencies/dependencyService.svelte";
import { DropzoneRegistry, DROPZONE_REGISTRY } from "$lib/dragging/registry";
import {
	REORDER_DROPZONE_FACTORY,
	ReorderDropzoneFactory,
} from "$lib/dragging/stackingReorderDropzoneManager";
import { FILE_SERVICE, FileService } from "$lib/files/fileService";
import { ResizeSync, RESIZE_SYNC } from "$lib/floating/resizeSync";
import {
	BITBUCKET_USER_SERVICE,
	BitbucketUserService,
} from "$lib/forge/bitbucket/bitbucketUserService.svelte";
import { CHECKS_MONITOR, ChecksMonitor } from "$lib/forge/checksMonitor.svelte";
import { FORGE_INFO_SERVICE, ForgeInfoService } from "$lib/forge/forgeInfo.svelte";
import { GitHubUserService, GITHUB_USER_SERVICE } from "$lib/forge/github/githubUserService.svelte";
import { GITLAB_USER_SERVICE, GitLabUserService } from "$lib/forge/gitlab/gitlabUserService.svelte";
import { LISTING_SERVICE, ListingService } from "$lib/forge/listingService.svelte";
import { PR_SERVICE, PrService } from "$lib/forge/prService.svelte";
import { REPO_SERVICE, RepoService } from "$lib/forge/repoService.svelte";
import { GitService, GIT_SERVICE } from "$lib/git/gitService";
import { HOOKS_SERVICE, HooksService } from "$lib/git/hooksService";
import { REMOTES_SERVICE, RemotesService } from "$lib/git/remotesService";
import { HISTORY_SERVICE, HistoryService } from "$lib/history/history";
import { OplogService, OPLOG_SERVICE } from "$lib/history/oplogService.svelte";
import { DiffService, DIFF_SERVICE } from "$lib/hunks/diffService.svelte";
import { ModeService, MODE_SERVICE } from "$lib/mode/modeService";
import { ProjectsService, PROJECTS_SERVICE } from "$lib/project/projectsService";
import { PROMPT_SERVICE, PromptService } from "$lib/prompt/promptService";
import { RustSecretService, SECRET_SERVICE } from "$lib/secrets/secretsService";
import {
	FileSelectionManager,
	FILE_SELECTION_MANAGER,
} from "$lib/selection/fileSelectionManager.svelte";
import { UncommittedService, UNCOMMITTED_SERVICE } from "$lib/selection/uncommittedService.svelte";
import { SETTINGS_SERVICE, SettingsService } from "$lib/settings/appSettings";
import { TerminalService, TERMINAL_SERVICE } from "$lib/settings/terminalService";
import { ShortcutService, SHORTCUT_SERVICE } from "$lib/shortcuts/shortcutService";
import { StackService, STACK_SERVICE } from "$lib/stacks/stackService.svelte";
import { ClientState, CLIENT_STATE } from "$lib/state/clientState.svelte";
import { UiState, UI_STATE, uiStateSlice } from "$lib/state/uiState.svelte";
import {
	UpstreamIntegrationService,
	UPSTREAM_INTEGRATION_SERVICE,
} from "$lib/upstream/upstreamIntegrationService.svelte";
import { WorktreeService, WORKTREE_SERVICE } from "$lib/worktree/worktreeService.svelte";
import { provideAll } from "@gitbutler/core/context";
import { reactive } from "@gitbutler/shared/reactiveUtils.svelte";
import { AppState, APP_STATE, APP_DISPATCH } from "@gitbutler/shared/redux/store.svelte";
import { DragStateService, DRAG_STATE_SERVICE } from "@gitbutler/ui/drag/dragStateService.svelte";
import { FModeManager } from "@gitbutler/ui/focus/fModeManager";
import { FOCUS_MANAGER, FocusManager } from "@gitbutler/ui/focus/focusManager";
import {
	EXTERNAL_LINK_SERVICE,
	type ExternalLinkService,
} from "@gitbutler/ui/utils/externalLinkService";
import { IMECompositionHandler, IME_COMPOSITION_HANDLER } from "@gitbutler/ui/utils/imeHandling";

export function initDependencies(args: {
	backend: IBackend;
	settingsService: SettingsService;
	homeDir: string;
}) {
	const { backend, settingsService, homeDir } = args;

	// ============================================================================
	// FOUNDATION LAYER - Core services that others depend on
	// ============================================================================

	const appState = new AppState();

	// ============================================================================
	// AUTHENTICATION & SECURITY
	// ============================================================================

	const secretsService = new RustSecretService(backend);

	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	const clientState = new ClientState(backend);
	const githubUserService = new GitHubUserService(clientState.backendApi);
	const gitlabUserService = new GitLabUserService(clientState.backendApi, secretsService);
	const bitbucketUserService = new BitbucketUserService(clientState.backendApi);

	const uiState = new UiState(
		reactive(() => clientState.uiState ?? uiStateSlice.getInitialState()),
		clientState.dispatch,
	);

	// ============================================================================
	// CONFIGURATION & SETTINGS
	// ============================================================================

	const projectsService = new ProjectsService(clientState.backendApi, homeDir, backend);
	const gitConfig = new GitConfigService(clientState.backendApi, clientState.dispatch, backend);
	const terminalService = new TerminalService(backend);

	// ============================================================================
	// AI SERVICES
	// ============================================================================

	const aiPromptService = new AIPromptService();
	const aiService = new AIService(gitConfig, secretsService);

	// ============================================================================
	// FORGE SERVICES
	// ============================================================================

	const forgeInfoService = new ForgeInfoService(clientState.backendApi);
	const prService = new PrService(clientState.backendApi);
	const listingService = new ListingService(clientState.backendApi, clientState.dispatch);
	const repoService = new RepoService(clientState.backendApi);
	const checksMonitor = new ChecksMonitor(clientState.backendApi);

	// ============================================================================
	// GIT & VERSION CONTROL
	// ============================================================================

	const gitService = new GitService(backend, clientState.backendApi);
	const baseBranchService = new BaseBranchService(clientState.backendApi);
	const branchService = new BranchService(clientState.backendApi);
	const remotesService = new RemotesService(backend);
	const hooksService = new HooksService(clientState.backendApi);

	// ============================================================================
	// STACKS & WORKSPACE MANAGEMENT
	// ============================================================================

	const stackService = new StackService(clientState.backendApi, clientState.dispatch, uiState);
	const modeService = new ModeService(clientState.backendApi);
	const worktreeService = new WorktreeService(clientState.backendApi);

	// ============================================================================
	// FILE & DIFF MANAGEMENT
	// ============================================================================

	const fileService = new FileService(backend, clientState.backendApi);
	const diffService = new DiffService(clientState.backendApi);

	// ============================================================================
	// HISTORY & OPERATIONS
	// ============================================================================

	const fModeManager = new FModeManager();
	const focusManager = new FocusManager(fModeManager);
	const historyService = new HistoryService(backend, clientState.backendApi);
	const oplogService = new OplogService(clientState.backendApi);
	// ============================================================================
	// SELECTION & EDITING
	// ============================================================================

	const uncommittedService = new UncommittedService(clientState, worktreeService, diffService);
	const fileSelectionManager = new FileSelectionManager(
		stackService,
		uncommittedService,
		worktreeService,
		oplogService,
		historyService,
	);

	// ============================================================================
	// PROJECT & DEPENDENCY MANAGEMENT
	// ============================================================================

	const dependencyService = new DependencyService(worktreeService);

	// ============================================================================
	// WORKFLOWS
	// ============================================================================

	const upstreamIntegrationService = new UpstreamIntegrationService(
		clientState.backendApi,
		stackService,
		prService,
	);

	// ============================================================================
	// UI & INTERACTION
	// ============================================================================

	const imeHandler = new IMECompositionHandler();
	const reorderDropzoneFactory = new ReorderDropzoneFactory(stackService, uiState);
	const shortcutService = new ShortcutService(backend);
	const dragStateService = new DragStateService();
	const dropzoneRegistry = new DropzoneRegistry();
	const resizeSync = new ResizeSync();

	// ============================================================================
	// SYSTEM SERVICES
	// ============================================================================

	const cliManager = new CLIManager(clientState.backendApi);
	const promptService = new PromptService(backend);

	// ============================================================================
	// UTILITIES
	// ============================================================================

	const urlService = new URLService(backend);
	const clipboardService = new ClipboardService(backend);
	const externalLinkService = {
		open: async (url) => await urlService.openExternalUrl(url),
	} satisfies ExternalLinkService;

	// ============================================================================
	// DEPENDENCY INJECTION REGISTRATION
	// ============================================================================

	provideAll([
		[AI_PROMPT_SERVICE, aiPromptService],
		[AI_SERVICE, aiService],
		[APP_DISPATCH, appState.appDispatch],
		[APP_STATE, appState],
		[BACKEND, backend],
		[BASE_BRANCH_SERVICE, baseBranchService],
		[BRANCH_SERVICE, branchService],
		[CLIENT_STATE, clientState],
		[CLIPBOARD_SERVICE, clipboardService],
		[CLI_MANAGER, cliManager],
		[DEPENDENCY_SERVICE, dependencyService],
		[DIFF_SERVICE, diffService],
		[DRAG_STATE_SERVICE, dragStateService],
		[DROPZONE_REGISTRY, dropzoneRegistry],
		[FILE_SERVICE, fileService],
		[FOCUS_MANAGER, focusManager],
		[CHECKS_MONITOR, checksMonitor],
		[FORGE_INFO_SERVICE, forgeInfoService],
		[LISTING_SERVICE, listingService],
		[PR_SERVICE, prService],
		[REPO_SERVICE, repoService],
		[GITHUB_USER_SERVICE, githubUserService],
		[GITLAB_USER_SERVICE, gitlabUserService],
		[BITBUCKET_USER_SERVICE, bitbucketUserService],
		[GIT_CONFIG_SERVICE, gitConfig],
		[GIT_SERVICE, gitService],
		[HISTORY_SERVICE, historyService],
		[HOOKS_SERVICE, hooksService],
		[FILE_SELECTION_MANAGER, fileSelectionManager],
		[IME_COMPOSITION_HANDLER, imeHandler],
		[MODE_SERVICE, modeService],
		[OPLOG_SERVICE, oplogService],
		[PROJECTS_SERVICE, projectsService],
		[PROMPT_SERVICE, promptService],
		[REMOTES_SERVICE, remotesService],
		[RESIZE_SYNC, resizeSync],
		[SECRET_SERVICE, secretsService],
		[SETTINGS_SERVICE, settingsService],
		[TERMINAL_SERVICE, terminalService],
		[SHORTCUT_SERVICE, shortcutService],
		[STACK_SERVICE, stackService],
		[REORDER_DROPZONE_FACTORY, reorderDropzoneFactory],
		[UI_STATE, uiState],
		[UNCOMMITTED_SERVICE, uncommittedService],
		[UPSTREAM_INTEGRATION_SERVICE, upstreamIntegrationService],
		[URL_SERVICE, urlService],
		[WORKTREE_SERVICE, worktreeService],
		[EXTERNAL_LINK_SERVICE, externalLinkService],
	]);
}
