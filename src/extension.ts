import type { ExtensionContext } from "vscode";
import { activateBetterComments } from "@/features/betterComments/betterCommentsFeature";
import { activateCommitMessageEditor } from "@/features/commitMessageEditor/commitMessageEditorFeature";
import { activateErrorLens, deactivateErrorLens } from "@/features/errorLens/errorLensFeature";
import { activateExplorerLayout } from "@/features/explorerLayout/explorerLayoutFeature";
import { activateIndentRainbow } from "@/features/indentRainbow/indentRainbowFeature";
import { activatePathIntellisense } from "@/features/pathIntellisense/pathIntellisenseFeature";
import { activateThemeAccent } from "@/features/themeAccent/themeAccentFeature";

export function activate(context: ExtensionContext): void {
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
