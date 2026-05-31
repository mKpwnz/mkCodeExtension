import * as vscode from "vscode";

export type PathIntellisenseConfiguration = {
    readonly enabled: boolean;
    readonly extensionOnImport: boolean;
    readonly showHiddenFiles: boolean;
    readonly autoSlashAfterDirectory: boolean;
    readonly mappings: Readonly<Record<string, string>>;
};

export function readPathIntellisenseConfiguration(): PathIntellisenseConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkPathIntellisense");

    return {
        enabled: configuration.get("enabled", true),
        extensionOnImport: configuration.get("extensionOnImport", false),
        showHiddenFiles: configuration.get("showHiddenFiles", false),
        autoSlashAfterDirectory: configuration.get("autoSlashAfterDirectory", false),
        mappings: configuration.get("mappings", {}),
    };
}
