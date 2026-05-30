import * as vscode from "vscode";

export const codeThemeSettingSection = "mkTheme";
export const codeThemeKey = "codeTheme";
export const defaultCodeThemeId = "mkCodeDark";

const legacyCodeThemeIds = new Map<string, string>([
    ["elegant", "mkCodeDark"],
    ["elegantDimmed", "mkCodeDimmed"],
    ["elegantLight", "mkCodeLight"],
]);

export function readConfiguredCodeThemeId(): string {
    const configuration = vscode.workspace.getConfiguration(codeThemeSettingSection);
    const value = configuration.get<string>(codeThemeKey, defaultCodeThemeId);

    if (typeof value !== "string" || value.trim().length === 0) {
        return defaultCodeThemeId;
    }

    return legacyCodeThemeIds.get(value) ?? value;
}

export async function updateConfiguredCodeThemeId(themeId: string): Promise<void> {
    if (themeId.trim().length === 0) {
        throw new Error("Code theme id must not be empty.");
    }

    const configuration = vscode.workspace.getConfiguration(codeThemeSettingSection);
    await configuration.update(codeThemeKey, themeId, vscode.ConfigurationTarget.Global);
}
