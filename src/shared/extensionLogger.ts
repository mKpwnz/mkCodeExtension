import * as vscode from "vscode";

export type LogLevel = "debug" | "info" | "warn" | "error";

const outputChannelName = "mK Coding Extension";
const maxMessageLines = 1000;

let outputChannel: vscode.LogOutputChannel | undefined;

export function logExtensionDebug(feature: string, message: string): void {
    logExtensionMessage("debug", feature, message);
}

export function logExtensionInfo(feature: string, message: string): void {
    logExtensionMessage("info", feature, message);
}

export function logExtensionWarn(feature: string, message: string): void {
    logExtensionMessage("warn", feature, message);
}

export function logExtensionError(feature: string, message: string): void {
    logExtensionMessage("error", feature, message);
}

export function showExtensionOutput(): void {
    getExtensionOutputChannel().show(true);
}

function logExtensionMessage(level: LogLevel, feature: string, message: string): void {
    const normalizedFeature = normalizeFeatureName(feature);
    const logger = getExtensionOutputChannel();

    for (const line of splitBoundedLines(message)) {
        logger[level](`[${normalizedFeature}] ${line}`);
    }
}

function getExtensionOutputChannel(): vscode.LogOutputChannel {
    outputChannel ??= vscode.window.createOutputChannel(outputChannelName, { log: true });
    return outputChannel;
}

function normalizeFeatureName(feature: string): string {
    const value = feature.trim();

    if (value.length === 0) {
        return "General";
    }

    return value;
}

function splitBoundedLines(message: string): readonly string[] {
    const lines = message.replaceAll("\r\n", "\n").split("\n");

    if (lines.length === 0) {
        return [""];
    }

    return lines.slice(0, maxMessageLines);
}
