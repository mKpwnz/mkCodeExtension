import * as vscode from "vscode";
import { PathCompletionProvider } from "@/features/pathIntellisense/pathCompletionProvider";
import { readPathIntellisenseConfiguration } from "@/features/pathIntellisense/pathIntellisenseConfiguration";

const documentSelector: vscode.DocumentSelector = [
    { scheme: "file", language: "javascript" },
    { scheme: "file", language: "javascriptreact" },
    { scheme: "file", language: "typescript" },
    { scheme: "file", language: "typescriptreact" },
    { scheme: "file", language: "json" },
    { scheme: "file", language: "css" },
    { scheme: "file", language: "scss" },
    { scheme: "file", language: "html" },
    { scheme: "file", language: "vue" },
    { scheme: "file", language: "svelte" },
];

export function activatePathIntellisense(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            documentSelector,
            new PathCompletionProvider(readPathIntellisenseConfiguration),
            "/",
            ".",
            "@",
            '"',
            "'",
        ),
    );
}
