import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import * as vscode from "vscode";
import type { CodeThemeVariant } from "@/features/codeTheme/codeThemeTypes";
import { logExtensionInfo } from "@/shared/extensionLogger";

export async function deleteUserCodeThemes(
    userVariantsDirectory: string,
    variants: readonly CodeThemeVariant[],
): Promise<boolean> {
    const userThemes = variants.filter((variant) => variant.source === "user");

    if (userThemes.length === 0) {
        logExtensionInfo("Code Theme Delete", "No user code themes are available for deletion.");
        void vscode.window.showInformationMessage("No user code themes to delete.");
        return false;
    }

    const selected = await vscode.window.showQuickPick(
        userThemes.map((variant) => ({
            label: variant.label,
            description: variant.id,
            variant,
        })),
        {
            title: "Delete User Code Themes",
            placeHolder: "Choose one or more imported code themes to delete",
            canPickMany: true,
            ignoreFocusOut: true,
        },
    );

    if (!selected || selected.length === 0) {
        logExtensionInfo("Code Theme Delete", "Deletion cancelled before selecting themes.");
        return false;
    }

    const confirmed = await vscode.window.showWarningMessage(
        `Delete ${selected.length} imported code theme(s)?`,
        { modal: true },
        "Delete",
    );

    if (confirmed !== "Delete") {
        logExtensionInfo("Code Theme Delete", "Deletion cancelled at confirmation prompt.");
        return false;
    }

    for (const item of selected) {
        deleteUserCodeThemeFile(userVariantsDirectory, item.variant.id);
        logExtensionInfo("Code Theme Delete", `Deleted user code theme "${item.variant.label}".`);
    }

    void vscode.window.showInformationMessage(`Deleted ${selected.length} user code theme(s).`);
    logExtensionInfo("Code Theme Delete", `Deleted ${selected.length} user code theme(s).`);
    return true;
}

function deleteUserCodeThemeFile(userVariantsDirectory: string, themeId: string): void {
    const targetPath = resolve(userVariantsDirectory, `${themeId}.json`);

    if (!targetPath.startsWith(userVariantsDirectory) || !existsSync(targetPath)) {
        return;
    }

    rmSync(targetPath, { force: true });
}
