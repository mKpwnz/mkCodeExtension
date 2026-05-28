import * as vscode from "vscode";

const themeName = "mK Theme Dark";
const accentSettingSection = "mkTheme";
const accentPresetKey = "highlightPreset";
const accentColorKey = "highlightColor";
const customPreset = "custom";
const defaultAccentColor = "#a1fb1a";

const presetColors = new Map<string, string>([
    ["azure", "#0792f1"],
    ["graphite", "#323239"],
    ["silver", "#efeff1"],
    ["green", "#17bf6b"],
    ["lime", "#a1fb1a"],
    ["amber", "#ffc632"],
    ["red", "#e91916"],
    ["coral", "#fa7342"],
    ["yellow", "#fbd91a"],
    ["cyan", "#1acafa"],
    ["violet", "#8270fa"],
    ["magenta", "#da5dfa"],
    ["pink", "#fb477e"],
    [customPreset, defaultAccentColor],
]);

const managedAccentKeys = [
    "activityBar.activeBorder",
    "activityBar.activeFocusBorder",
    "activityBar.foreground",
    "activityBarBadge.background",
    "checkbox.selectBorder",
    "commandCenter.activeBorder",
    "editor.snippetFinalTabstopHighlightBorder",
    "editorSuggestWidget.highlightForeground",
    "focusBorder",
    "inputOption.activeBorder",
    "inputOption.activeForeground",
    "link.activeForeground",
    "list.activeSelectionIconForeground",
    "list.focusHighlightForeground",
    "list.focusOutline",
    "list.highlightForeground",
    "notificationLink.foreground",
    "panelTitle.activeBorder",
    "peekView.border",
    "pickerGroup.foreground",
    "progressBar.background",
    "settings.modifiedItemIndicator",
    "statusBarItem.focusBorder",
    "tab.activeBorderTop",
    "tab.activeModifiedBorder",
    "terminal.tab.activeBorder",
    "textLink.activeForeground",
    "textLink.foreground",
] as const;

export function activateThemeAccent(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(accentSettingSection)) {
                void applyConfiguredAccentColor();
            }
        }),
    );

    void applyConfiguredAccentColor();
}

async function applyConfiguredAccentColor(): Promise<void> {
    const accentColor = getConfiguredAccentColor();
    const configuration = vscode.workspace.getConfiguration();
    const currentCustomizations = configuration.get<Record<string, unknown>>(
        "workbench.colorCustomizations",
        {},
    );
    const themeCustomizations = getThemeCustomizations(currentCustomizations);
    const nextThemeCustomizations = {
        ...themeCustomizations,
        ...buildAccentColors(accentColor),
    };
    const nextCustomizations = {
        ...currentCustomizations,
        [`[${themeName}]`]: nextThemeCustomizations,
    };

    if (JSON.stringify(currentCustomizations) === JSON.stringify(nextCustomizations)) {
        return;
    }

    await configuration.update(
        "workbench.colorCustomizations",
        nextCustomizations,
        vscode.ConfigurationTarget.Global,
    );
}

function getConfiguredAccentColor(): string {
    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    const preset = configuration.get<string>(accentPresetKey, "lime");

    if (preset !== customPreset) {
        return presetColors.get(preset) ?? defaultAccentColor;
    }

    return normalizeColor(configuration.get(accentColorKey, defaultAccentColor));
}

function normalizeColor(value: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        return value.toLowerCase();
    }

    return defaultAccentColor;
}

function getThemeCustomizations(customizations: Record<string, unknown>): Record<string, string> {
    const themeValue = customizations[`[${themeName}]`];

    if (!themeValue || typeof themeValue !== "object" || Array.isArray(themeValue)) {
        return {};
    }

    return themeValue as Record<string, string>;
}

function buildAccentColors(accentColor: string): Record<string, string> {
    const accentColors: Record<string, string> = {};

    for (const key of managedAccentKeys) {
        accentColors[key] = accentColor;
    }

    accentColors["activityBar.activeBackground"] = "#171717";
    accentColors["activityBarBadge.foreground"] = "#111111";
    accentColors["editor.rangeHighlightBackground"] = `${accentColor}12`;
    accentColors["editor.snippetTabstopHighlightBackground"] = `${accentColor}1a`;
    accentColors["editorUnnecessaryCode.border"] = `${accentColor}66`;
    accentColors["settings.focusedRowBorder"] = `${accentColor}66`;

    return accentColors;
}
