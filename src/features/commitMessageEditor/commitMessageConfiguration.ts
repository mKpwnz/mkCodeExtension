import * as vscode from "vscode";

export type CommitMessageConfiguration = {
    readonly staticTemplate: readonly string[];
    readonly reduceEmptyLines: boolean;
    readonly saveAndClose: boolean;
};

export function readCommitMessageConfiguration(): CommitMessageConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkCommitMessageEditor");

    return {
        staticTemplate: configuration.get("staticTemplate", [
            "feat: Short description",
            "",
            "Message body",
            "",
            "Message footer",
        ]),
        reduceEmptyLines: configuration.get("reduceEmptyLines", true),
        saveAndClose: configuration.get("saveAndClose", false),
    };
}
