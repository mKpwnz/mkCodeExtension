import * as vscode from "vscode";
import { generateCodexCommitMessage } from "@/features/commitMessageEditor/codexCommitMessage";
import { readCommitMessageConfiguration } from "@/features/commitMessageEditor/commitMessageConfiguration";
import {
    copyText,
    getCommitMessageWebviewContent,
    reduceEmptyLines,
} from "@/features/commitMessageEditor/commitMessageWebview";
import { readGitCommitMessage, writeGitCommitMessage } from "@/features/commitMessageEditor/gitScm";
import {
    accentColorKey,
    accentPresetKey,
    accentSettingSection,
    resolveAccentColor,
} from "@/features/themeAccent/accentPresets";
import { logExtensionError, showExtensionOutput } from "@/shared/extensionLogger";

const featureName = "Commit Message Editor";
const openPanels = new Set<vscode.WebviewPanel>();

export function activateCommitMessageEditor(context: vscode.ExtensionContext): void {
    syncBuiltInCommitMessageGeneration();

    context.subscriptions.push(
        vscode.commands.registerCommand("mkCommitMessageEditor.openEditor", () => openEditor()),
        vscode.commands.registerCommand("mkCommitMessageEditor.loadTemplate", () => loadTemplate()),
        vscode.commands.registerCommand("mkCommitMessageEditor.copyFromScmInputBox", () =>
            copyFromScmInputBox(),
        ),
        vscode.commands.registerCommand("mkCommitMessageEditor.generateWithCodex", () =>
            generateWithCodexToScmInputBox(),
        ),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("mkCommitMessageEditor")) {
                syncBuiltInCommitMessageGeneration();
            }
        }),
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

    panel.webview.html = getCommitMessageWebviewContent(
        initialMessage,
        configuration.codexGenerationEnabled,
        readAccentColor(),
    );
    openPanels.add(panel);
    panel.onDidDispose(() => {
        openPanels.delete(panel);
    });
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

        if (event.command === "generateWithCodex") {
            await generateWithCodexToWebview(panel);
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

async function generateWithCodexToScmInputBox(): Promise<void> {
    try {
        const message = await generateWithProgress();
        await applyGeneratedCommitMessage(message);
    } catch (error) {
        showCodexGenerationError(error);
        await notifyCodexGenerationFinished();
    }
}

async function generateWithCodexToWebview(panel: vscode.WebviewPanel): Promise<void> {
    try {
        const message = await generateWithProgress();
        await applyGeneratedCommitMessage(message);
    } catch (error) {
        showCodexGenerationError(error);
        await panel.webview.postMessage({ command: "codexGenerationFinished" });
    }
}

async function generateWithProgress(): Promise<string> {
    const configuration = readCommitMessageConfiguration();

    if (!configuration.codexGenerationEnabled) {
        throw new Error("Enable Codex commit message generation in the settings first.");
    }

    return vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Generating commit message with Codex",
            cancellable: true,
        },
        async (_progress, cancellationToken) =>
            generateCodexCommitMessage(configuration, cancellationToken),
    );
}

function showCodexGenerationError(error: unknown): void {
    const message = error instanceof Error ? error.message : "Unknown Codex generation error.";
    logExtensionError(featureName, `Codex commit message generation failed: ${message}`);
    showExtensionOutput();
    void vscode.window.showErrorMessage(`Codex commit message generation failed: ${message}`);
}

async function applyGeneratedCommitMessage(message: string): Promise<void> {
    await writeGitCommitMessage(message);
    await postToOpenCommitMessageEditors({ command: "generatedWithCodex", message });
}

async function notifyCodexGenerationFinished(): Promise<void> {
    await postToOpenCommitMessageEditors({ command: "codexGenerationFinished" });
}

async function postToOpenCommitMessageEditors(message: {
    readonly command: "generatedWithCodex" | "codexGenerationFinished";
    readonly message?: string;
}): Promise<void> {
    const posts = [...openPanels].map(async (panel) => panel.webview.postMessage(message));
    await Promise.all(posts);
}

function syncBuiltInCommitMessageGeneration(): void {
    const configuration = readCommitMessageConfiguration();

    if (!configuration.codexGenerationEnabled || !configuration.hideBuiltInGenerateButton) {
        return;
    }

    void disableCopilotForScmInput();
}

async function disableCopilotForScmInput(): Promise<void> {
    const configuration = vscode.workspace.getConfiguration("github.copilot");
    const enabled = configuration.get<Record<string, unknown>>("enable", {});

    if (enabled.scminput === false) {
        return;
    }

    await configuration.update(
        "enable",
        {
            ...enabled,
            scminput: false,
        },
        vscode.ConfigurationTarget.Global,
    );
}

function readAccentColor(): string {
    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    const preset = configuration.get<string>(accentPresetKey, "lime");
    const customColor = configuration.get<string>(accentColorKey, "#a1fb1a");

    return resolveAccentColor(preset, customColor);
}
