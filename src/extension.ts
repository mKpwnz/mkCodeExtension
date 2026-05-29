import type { ExtensionContext } from "vscode";
import { activateBetterComments } from "@/features/betterComments/betterCommentsFeature";
import { activateCommitMessageEditor } from "@/features/commitMessageEditor/commitMessageEditorFeature";
import { activateErrorLens, deactivateErrorLens } from "@/features/errorLens/errorLensFeature";
import { activateExplorerLayout } from "@/features/explorerLayout/explorerLayoutFeature";
import { activateIndentRainbow } from "@/features/indentRainbow/indentRainbowFeature";
import { activatePathIntellisense } from "@/features/pathIntellisense/pathIntellisenseFeature";
import { activateThemeAccent } from "@/features/themeAccent/themeAccentFeature";
import { logExtensionInfo } from "@/shared/extensionLogger";

export function activate(context: ExtensionContext): void {
    logExtensionStartup(context);
    activateIndentRainbow(context);
    activateThemeAccent(context);
    activateBetterComments(context);
    activateErrorLens(context);
    activatePathIntellisense(context);
    activateCommitMessageEditor(context);
    activateExplorerLayout(context);
}

export function deactivate(): void {
    deactivateErrorLens();
    return;
}

function logExtensionStartup(context: ExtensionContext): void {
    const packageJson = context.extension.packageJSON as { displayName?: string; version?: string };
    const displayName = packageJson.displayName ?? "mK Coding Extension";
    const version = packageJson.version ?? "unknown";

    logExtensionInfo("Core", `${displayName} started. Version: ${version}`);
}
