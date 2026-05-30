import * as vscode from "vscode";
import {
    type AccentPreset,
    accentColorKey,
    accentPresetKey,
    accentPresets,
    accentSettingSection,
    customPreset,
    resolveAccentColor,
} from "@/features/themeAccent/accentPresets";
import {
    createHighlightColorManagerHtml,
    createNonce,
} from "@/features/themeAccent/highlightColorManagerWebview";
import {
    applyAccentColor,
    applyConfiguredAccentColor,
} from "@/features/themeAccent/themeCustomizations";
import {
    deleteUserAccentColorFile,
    getUserAccentColorsDirectory,
    readUserAccentColors,
    renameUserAccentColorFile,
    saveUserAccentColor,
    type UserAccentColor,
} from "@/features/themeAccent/userAccentColors";
import { defaultHighlightColor, normalizeHexColor } from "@/shared/color";
import { logExtensionDebug, logExtensionInfo } from "@/shared/extensionLogger";

const selectHighlightColorCommand = "mkTheme.selectHighlightColor";
const setCustomHighlightColorCommand = "mkTheme.manageCustomHighlightColors";
const deleteUserHighlightColorsCommand = "mkTheme.deleteUserHighlightColors";
const previewDebounceMilliseconds = 40;
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

type AccentColorOption = {
    readonly id: string;
    readonly label: string;
    readonly color: string;
    readonly source: "builtIn" | "custom" | "user";
};

type AccentQuickPickItem = vscode.QuickPickItem & {
    readonly option: AccentColorOption;
};

export function activateThemeAccent(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(selectHighlightColorCommand, () =>
            selectHighlightColor(context),
        ),
        vscode.commands.registerCommand(setCustomHighlightColorCommand, () =>
            openCustomHighlightColorManager(context),
        ),
        vscode.commands.registerCommand(deleteUserHighlightColorsCommand, () =>
            deleteUserHighlightColors(context),
        ),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(accentSettingSection)) {
                void applyConfiguredAccentColor();
            }
        }),
    );

    void applyConfiguredAccentColor();
}

async function selectHighlightColor(context: vscode.ExtensionContext): Promise<void> {
    logExtensionInfo("Theme Accent", "Select highlight color command started.");
    const currentOption = getCurrentColorOption(context);

    if (!currentOption) {
        logExtensionInfo(
            "Theme Accent",
            "Select command aborted because no presets were available.",
        );
        void vscode.window.showWarningMessage("No mK highlight color presets were found.");
        return;
    }

    const quickPick = vscode.window.createQuickPick<AccentQuickPickItem>();
    const previewState: AccentPreviewState = {
        accepted: false,
        currentPreviewId: currentOption.id,
        pendingPreviewId: currentOption.id,
        timer: undefined,
    };

    quickPick.title = "Select mK Highlight Color";
    quickPick.placeholder = "Choose the active UI highlight color";
    quickPick.items = createQuickPickItems(context, currentOption);
    quickPick.activeItems = quickPick.items.filter((item) => item.option.id === currentOption.id);
    quickPick.onDidChangeActive((items) => schedulePreview(items[0]?.option, previewState));
    quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0];

        if (!selected || selected.option.id.length === 0) {
            return;
        }

        previewState.accepted = true;
        logExtensionInfo("Theme Accent", `Selected highlight color "${selected.option.label}".`);
        void acceptSelectedOption(selected.option);
        quickPick.hide();
    });
    quickPick.onDidHide(() => {
        clearPreviewTimer(previewState);
        quickPick.dispose();

        if (!previewState.accepted) {
            logExtensionInfo(
                "Theme Accent",
                `Selection cancelled; restored "${currentOption.label}".`,
            );
            void applyAccentColor(currentOption.color);
        }
    });
    quickPick.show();
}

async function acceptSelectedOption(option: AccentColorOption): Promise<void> {
    if (option.source === "user") {
        await applyCustomHighlightColor(option.color);
        return;
    }

    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    await configuration.update(accentPresetKey, option.id, vscode.ConfigurationTarget.Global);
    await applyAccentColor(option.color);
}

function openCustomHighlightColorManager(
    context: vscode.ExtensionContext,
    restoreColor = getConfiguredAccentColor(),
): void {
    const initialColor = getConfiguredAccentColor();
    const panel = vscode.window.createWebviewPanel(
        "mkThemeCustomHighlightColors",
        "Manage Custom Highlight Colors",
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "assets", "webviews")],
        },
    );
    const nonce = createNonce();
    let accepted = false;

    panel.webview.html = createHighlightColorManagerHtml({
        extensionUri: context.extensionUri,
        webview: panel.webview,
        nonce,
        state: {
            currentColor: initialColor,
            initialColor,
            systemColors: getBuiltInAccentPresets(),
            userColors: readUserAccentColors(context),
            previewDebounceMilliseconds,
        },
    });
    const configurationDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration(accentSettingSection)) {
            return;
        }

        void panel.webview.postMessage({
            command: "currentAccentChanged",
            color: getConfiguredAccentColor(),
            userColors: readUserAccentColors(context),
        });
    });
    panel.webview.onDidReceiveMessage((message: unknown) => {
        const event = readColorPickerMessage(message);

        if (!event) {
            return;
        }

        if (event.command === "requestCurrentAccent") {
            void panel.webview.postMessage({
                command: "currentAccentChanged",
                color: getConfiguredAccentColor(),
                userColors: readUserAccentColors(context),
            });
            return;
        }

        if (event.command === "preview") {
            void applyAccentColor(event.color);
            return;
        }

        if (event.command === "apply") {
            accepted = true;
            void applyCustomHighlightColor(event.color);
            return;
        }

        if (event.command === "applySystem") {
            accepted = true;
            void applySystemHighlightColor(event.id);
            return;
        }

        if (event.command === "save") {
            restoreColor = event.color;
            void saveAndApplyUserHighlightColor(context, event.label, event.color, event.id).then(
                (saved) =>
                    panel.webview.postMessage({
                        command: "colorsChanged",
                        colors: readUserAccentColors(context),
                        currentColor: saved.color,
                        selectedId: saved.id,
                    }),
            );
            return;
        }

        if (event.command === "rename") {
            if (hasUserAccentLabel(context, event.label, event.id)) {
                void panel.webview.postMessage({ command: "nameRejected", label: event.label });
                return;
            }

            const renamed = renameUserAccentColorFile(
                getUserAccentColorsDirectory(context),
                event.id,
                event.label,
            );
            void panel.webview.postMessage({
                command: "colorsChanged",
                colors: readUserAccentColors(context),
                currentColor: renamed?.color ?? getConfiguredAccentColor(),
                selectedId: renamed?.id ?? "",
            });
            return;
        }

        if (event.command === "delete") {
            deleteUserAccentColorFile(getUserAccentColorsDirectory(context), event.id);
            void panel.webview.postMessage({
                command: "colorsChanged",
                colors: readUserAccentColors(context),
                currentColor: getConfiguredAccentColor(),
                selectedId: "",
            });
            return;
        }

        if (event.command === "close") {
            accepted = true;
            void applyConfiguredAccentColor().then(() => panel.dispose());
        }
    });
    panel.onDidDispose(() => {
        configurationDisposable.dispose();

        if (!accepted) {
            logExtensionInfo("Theme Accent", "Custom highlight color picker cancelled.");
            void applyAccentColor(restoreColor);
        }
    });
}

async function deleteUserHighlightColors(context: vscode.ExtensionContext): Promise<void> {
    const userColors = readUserAccentColors(context);

    if (userColors.length === 0) {
        logExtensionInfo("Theme Accent", "No user highlight colors are available for deletion.");
        void vscode.window.showInformationMessage("No user highlight colors to delete.");
        return;
    }

    const selected = await vscode.window.showQuickPick(
        userColors.map((color) => ({
            label: color.label,
            description: color.color,
            color,
        })),
        {
            title: "Delete User Highlight Colors",
            placeHolder: "Choose one or more saved highlight colors to delete",
            canPickMany: true,
            ignoreFocusOut: true,
        },
    );

    if (!selected || selected.length === 0) {
        logExtensionInfo("Theme Accent", "Deletion cancelled before selecting colors.");
        return;
    }

    const confirmed = await vscode.window.showWarningMessage(
        `Delete ${selected.length} saved highlight color(s)?`,
        { modal: true },
        "Delete",
    );

    if (confirmed !== "Delete") {
        logExtensionInfo("Theme Accent", "Deletion cancelled at confirmation prompt.");
        return;
    }

    const userColorsDirectory = getUserAccentColorsDirectory(context);

    for (const item of selected) {
        deleteUserAccentColorFile(userColorsDirectory, item.color.id);
        logExtensionInfo("Theme Accent", `Deleted user highlight color "${item.color.label}".`);
    }

    void vscode.window.showInformationMessage(
        `Deleted ${selected.length} user highlight color(s).`,
    );
}

async function saveAndApplyUserHighlightColor(
    context: vscode.ExtensionContext,
    label: string,
    color: string,
    existingColorId = "",
): Promise<UserAccentColor> {
    const savedColor = saveUserAccentColor(
        getUserAccentColorsDirectory(context),
        label,
        color,
        existingColorId,
    );

    logExtensionInfo("Theme Accent", `Saved user highlight color "${savedColor.label}".`);
    await applyCustomHighlightColor(savedColor.color);
    return savedColor;
}

async function applyCustomHighlightColor(color: string): Promise<void> {
    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    const normalizedColor = normalizeHexColor(color, defaultHighlightColor);

    await configuration.update(accentColorKey, normalizedColor, vscode.ConfigurationTarget.Global);
    await configuration.update(accentPresetKey, customPreset, vscode.ConfigurationTarget.Global);
    await applyAccentColor(normalizedColor);
}

async function applySystemHighlightColor(presetId: string): Promise<void> {
    const preset = getBuiltInAccentPresets().find((candidate) => candidate.id === presetId);

    if (!preset) {
        return;
    }

    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    await configuration.update(accentPresetKey, preset.id, vscode.ConfigurationTarget.Global);
    await applyAccentColor(preset.color);
}

function getBuiltInAccentPresets(): readonly AccentPreset[] {
    return accentPresets.filter((preset) => preset.id !== customPreset);
}

function hasUserAccentLabel(
    context: vscode.ExtensionContext,
    label: string,
    ignoredId = "",
): boolean {
    const normalizedLabel = label.trim().toLocaleLowerCase();

    if (normalizedLabel.length === 0) {
        return false;
    }

    return readUserAccentColors(context).some(
        (color) =>
            color.id !== ignoredId && color.label.trim().toLocaleLowerCase() === normalizedLabel,
    );
}

function getCurrentColorOption(context: vscode.ExtensionContext): AccentColorOption | undefined {
    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    const configuredPresetId = configuration.get<string>(accentPresetKey, "lime");
    const configuredColor = getConfiguredAccentColor();

    return (
        findBuiltInOption(configuredPresetId) ??
        findUserOptionByColor(context, configuredColor) ??
        createCustomOption(configuredColor)
    );
}

function getConfiguredAccentColor(): string {
    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    const preset = configuration.get<string>(accentPresetKey, "lime");
    const customColor = configuration.get<string>(accentColorKey, defaultHighlightColor);

    return resolveAccentColor(preset, customColor);
}

function findBuiltInOption(optionId: string): AccentColorOption | undefined {
    const customColor = vscode.workspace
        .getConfiguration(accentSettingSection)
        .get<string>(accentColorKey, defaultHighlightColor);

    return accentPresets
        .map((preset) => ({
            id: preset.id,
            label: preset.label,
            color: resolveAccentColor(preset.id, customColor),
            source: preset.id === customPreset ? "custom" : "builtIn",
        }))
        .find((option) => option.id === optionId) as AccentColorOption | undefined;
}

function findUserOptionByColor(
    context: vscode.ExtensionContext,
    color: string,
): AccentColorOption | undefined {
    return readUserAccentColors(context)
        .map(userColorToOption)
        .find((option) => option.color === color);
}

function createCustomOption(color: string): AccentColorOption {
    return {
        id: customPreset,
        label: "Custom",
        color,
        source: "custom",
    };
}

function userColorToOption(color: UserAccentColor): AccentColorOption {
    return {
        id: color.id,
        label: color.label,
        color: color.color,
        source: "user",
    };
}

function createQuickPickItems(
    context: vscode.ExtensionContext,
    currentOption: AccentColorOption,
): readonly AccentQuickPickItem[] {
    const customColor = getConfiguredAccentColor();
    const builtInItems = accentPresets
        .filter((preset) => preset.id !== customPreset)
        .map((preset) => {
            const color = resolveAccentColor(preset.id, customColor);

            return createQuickPickItem(
                {
                    id: preset.id,
                    label: preset.label,
                    color,
                    source: "builtIn",
                },
                currentOption,
            );
        });
    const userItems = readUserAccentColors(context).map((color) =>
        createQuickPickItem(userColorToOption(color), currentOption),
    );
    const items = [createSeparator("mK Coding Extension"), ...builtInItems];

    if (userItems.length > 0) {
        items.push(createSeparator("User Highlight Colors"), ...userItems);
    }

    return items;
}

function createQuickPickItem(
    option: AccentColorOption,
    currentOption: AccentColorOption,
): AccentQuickPickItem {
    const item: AccentQuickPickItem = {
        label: option.label,
        description: option.color,
        option,
    };

    if (option.id === currentOption.id || option.color === currentOption.color) {
        item.detail = "Current";
    }

    return item;
}

function createSeparator(label: string): AccentQuickPickItem {
    return {
        kind: vscode.QuickPickItemKind.Separator,
        label,
        option: {
            id: "",
            label,
            color: defaultHighlightColor,
            source: "builtIn",
        },
    };
}

type AccentPreviewState = {
    accepted: boolean;
    currentPreviewId: string;
    pendingPreviewId: string;
    timer: NodeJS.Timeout | undefined;
};

function schedulePreview(
    option: AccentColorOption | undefined,
    previewState: AccentPreviewState,
): void {
    if (!option || option.id.length === 0 || option.id === previewState.currentPreviewId) {
        return;
    }

    previewState.pendingPreviewId = option.id;
    clearPreviewTimer(previewState);
    previewState.timer = setTimeout(() => {
        previewState.timer = undefined;

        if (previewState.pendingPreviewId !== option.id) {
            return;
        }

        previewState.currentPreviewId = option.id;
        logExtensionDebug("Theme Accent", `Previewing highlight color "${option.label}".`);
        void applyAccentColor(option.color);
    }, previewDebounceMilliseconds);
}

function clearPreviewTimer(previewState: AccentPreviewState): void {
    if (!previewState.timer) {
        return;
    }

    clearTimeout(previewState.timer);
    previewState.timer = undefined;
}

type ColorPickerMessage =
    | {
          readonly command: "requestCurrentAccent";
      }
    | {
          readonly command: "preview" | "apply";
          readonly color: string;
      }
    | {
          readonly command: "save";
          readonly color: string;
          readonly id: string;
          readonly label: string;
      }
    | {
          readonly command: "rename";
          readonly id: string;
          readonly label: string;
      }
    | {
          readonly command: "delete";
          readonly id: string;
      }
    | {
          readonly command: "applySystem";
          readonly id: string;
      }
    | {
          readonly command: "close";
      };

function readColorPickerMessage(message: unknown): ColorPickerMessage | undefined {
    if (!message || typeof message !== "object" || Array.isArray(message)) {
        return undefined;
    }

    const candidate = message as {
        readonly command?: unknown;
        readonly color?: unknown;
        readonly id?: unknown;
        readonly label?: unknown;
    };

    if (
        candidate.command !== "preview" &&
        candidate.command !== "apply" &&
        candidate.command !== "requestCurrentAccent" &&
        candidate.command !== "save" &&
        candidate.command !== "rename" &&
        candidate.command !== "delete" &&
        candidate.command !== "applySystem" &&
        candidate.command !== "close"
    ) {
        return undefined;
    }

    if (candidate.command === "requestCurrentAccent") {
        return { command: "requestCurrentAccent" };
    }

    if (candidate.command === "close") {
        return { command: "close" };
    }

    if (candidate.command === "delete") {
        return typeof candidate.id === "string"
            ? { command: "delete", id: candidate.id }
            : undefined;
    }

    if (candidate.command === "applySystem") {
        return typeof candidate.id === "string"
            ? { command: "applySystem", id: candidate.id }
            : undefined;
    }

    if (candidate.command === "rename") {
        if (typeof candidate.id !== "string" || typeof candidate.label !== "string") {
            return undefined;
        }

        return {
            command: "rename",
            id: candidate.id,
            label: candidate.label,
        };
    }

    if (typeof candidate.color !== "string" || !hexColorPattern.test(candidate.color)) {
        return undefined;
    }

    if (candidate.command === "save") {
        return {
            command: "save",
            color: candidate.color.toLowerCase(),
            id: typeof candidate.id === "string" ? candidate.id : "",
            label: typeof candidate.label === "string" ? candidate.label : "Custom Highlight",
        };
    }

    return {
        command: candidate.command,
        color: candidate.color.toLowerCase(),
    };
}
