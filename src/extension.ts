import type { ExtensionContext } from "vscode";
import { activateIndentRainbow } from "./features/indent-rainbow";
import { activateThemeAccent } from "./features/theme-accent";

export function activate(context: ExtensionContext): void {
    activateIndentRainbow(context);
    activateThemeAccent(context);
}

export function deactivate(): void {
    return;
}
