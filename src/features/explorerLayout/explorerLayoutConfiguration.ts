import * as vscode from "vscode";
import { clampNumber } from "@/shared/settings";

export type ExplorerLayoutConfiguration = {
    readonly enabled: boolean;
    readonly indent: number;
    readonly renderIndentGuides: "none" | "onHover" | "always";
};

export function readExplorerLayoutConfiguration(): ExplorerLayoutConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkExplorer");

    return {
        enabled: configuration.get("enabled", true),
        indent: clampNumber(configuration.get("indent"), 4, 40, 16),
        renderIndentGuides: readRenderIndentGuides(configuration),
    };
}

function readRenderIndentGuides(
    configuration: vscode.WorkspaceConfiguration,
): ExplorerLayoutConfiguration["renderIndentGuides"] {
    const value = configuration.get<string>("renderIndentGuides", "always");

    if (value === "none" || value === "onHover" || value === "always") {
        return value;
    }

    return "always";
}
