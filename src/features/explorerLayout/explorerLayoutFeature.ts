import * as vscode from "vscode";
import { readExplorerLayoutConfiguration } from "@/features/explorerLayout/explorerLayoutConfiguration";

export function activateExplorerLayout(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("mkExplorer")) {
                void applyExplorerLayout();
            }
        }),
    );

    void applyExplorerLayout();
}

async function applyExplorerLayout(): Promise<void> {
    const configuration = readExplorerLayoutConfiguration();
    const workbenchConfiguration = vscode.workspace.getConfiguration("workbench");

    if (!configuration.enabled) {
        return;
    }

    await updateIfChanged(workbenchConfiguration, "tree.indent", configuration.indent);
    await updateIfChanged(
        workbenchConfiguration,
        "tree.renderIndentGuides",
        configuration.renderIndentGuides,
    );
}

async function updateIfChanged<T>(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
    value: T,
): Promise<void> {
    if (configuration.get<T>(key) === value) {
        return;
    }

    await configuration.update(key, value, vscode.ConfigurationTarget.Global);
}
