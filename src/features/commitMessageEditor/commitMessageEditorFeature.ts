import * as vscode from "vscode";
import { readCommitMessageConfiguration } from "@/features/commitMessageEditor/commitMessageConfiguration";
import {
    copyText,
    getCommitMessageWebviewContent,
    reduceEmptyLines,
} from "@/features/commitMessageEditor/commitMessageWebview";
import { readGitCommitMessage, writeGitCommitMessage } from "@/features/commitMessageEditor/gitScm";

export function activateCommitMessageEditor(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand("mkCommitMessageEditor.openEditor", () => openEditor()),
        vscode.commands.registerCommand("mkCommitMessageEditor.loadTemplate", () => loadTemplate()),
        vscode.commands.registerCommand("mkCommitMessageEditor.copyFromScmInputBox", () =>
            copyFromScmInputBox(),
        ),
    );
}

async function openEditor(): Promise<void> {
    const currentMessage = await readGitCommitMessage();
    const configuration = readCommitMessageConfiguration();
    const initialMessage =
        currentMessage.length > 0 ? currentMessage : configuration.staticTemplate.join("\n");
    const panel = vscode.window.createWebviewPanel(
        "mkCommitMessageEditor",
        "mK Commit Message Editor",
        vscode.ViewColumn.Active,
        { enableScripts: true },
    );

    panel.webview.html = getCommitMessageWebviewContent(initialMessage);
    panel.webview.onDidReceiveMessage(async (message: unknown) => {
        if (!message || typeof message !== "object") {
            return;
        }

        const event = message as { command?: string; message?: string };

        if (typeof event.message !== "string") {
            return;
        }

        const nextMessage = configuration.reduceEmptyLines
            ? reduceEmptyLines(event.message)
            : event.message;

        if (event.command === "save") {
            await writeGitCommitMessage(nextMessage);

            if (configuration.saveAndClose) {
                panel.dispose();
            }
        }

        if (event.command === "copy") {
            await copyText(nextMessage);
        }
    });
}

async function loadTemplate(): Promise<void> {
    const configuration = readCommitMessageConfiguration();
    await writeGitCommitMessage(configuration.staticTemplate.join("\n"));
}

async function copyFromScmInputBox(): Promise<void> {
    await copyText(await readGitCommitMessage());
}
