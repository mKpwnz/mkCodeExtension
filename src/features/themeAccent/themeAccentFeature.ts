import * as vscode from "vscode";
import { accentSettingSection } from "@/features/themeAccent/accentPresets";
import { applyConfiguredAccentColor } from "@/features/themeAccent/themeCustomizations";

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
