import * as vscode from "vscode";
import { createNonce, createReactWebviewHtml } from "@/shared/reactWebviewHtml";

export function getCommitMessageWebviewContent(
    extensionUri: vscode.Uri,
    webview: vscode.Webview,
    message: string,
    codexGenerationEnabled: boolean,
): string {
    return createReactWebviewHtml({
        extensionUri,
        loadingLabel: "Loading commit message editor...",
        nonce: createNonce(),
        state: {
            codexGenerationEnabled,
            initialMessage: message,
            route: "commitMessageEditor",
        },
        title: "mK Commit Message Editor",
        webview,
    });
}

export function reduceEmptyLines(message: string): string {
    return message.replaceAll(/\n{3,}/g, "\n\n").replace(/\n+$/g, "");
}

export function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

export async function copyText(message: string): Promise<void> {
    await vscode.env.clipboard.writeText(message);
}
