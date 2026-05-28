import * as vscode from "vscode";
import {
    collectDecorationBuckets,
    shouldDecorateLanguage,
} from "@/features/indentRainbow/indentAnalysis";
import {
    clearEditorDecorations,
    createIndentRainbowDecorations,
    disposeIndentRainbowDecorations,
} from "@/features/indentRainbow/indentDecorations";
import { readIndentRainbowConfiguration } from "@/features/indentRainbow/indentRainbowConfiguration";
import type {
    ActiveIndentRainbowDecorations,
    ParsedIndentRainbowConfiguration,
} from "@/features/indentRainbow/indentRainbowTypes";

let activeDecorations: ActiveIndentRainbowDecorations | undefined;
let updateTimeout: ReturnType<typeof globalThis.setTimeout> | undefined;

export function activateIndentRainbow(context: vscode.ExtensionContext): void {
    rebuildDecorations(context);
    scheduleActiveEditorUpdate();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            scheduleActiveEditorUpdate();
        }),
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                scheduleActiveEditorUpdate();
            }
        }),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("mkIndentRainbow")) {
                rebuildDecorations(context);
                scheduleActiveEditorUpdate();
            }
        }),
    );
}

function rebuildDecorations(context: vscode.ExtensionContext): void {
    disposeIndentRainbowDecorations(activeDecorations);

    const configuration = readIndentRainbowConfiguration();
    activeDecorations = createIndentRainbowDecorations(configuration);
    context.subscriptions.push(...activeDecorations.indentTypes, activeDecorations.errorType);

    if (activeDecorations.tabMixType) {
        context.subscriptions.push(activeDecorations.tabMixType);
    }
}

function scheduleActiveEditorUpdate(): void {
    const configuration = readIndentRainbowConfiguration();

    if (updateTimeout) {
        globalThis.clearTimeout(updateTimeout);
    }

    updateTimeout = globalThis.setTimeout(
        () => updateActiveEditor(configuration),
        configuration.updateDelay,
    );
}

function updateActiveEditor(configuration: ParsedIndentRainbowConfiguration): void {
    const editor = vscode.window.activeTextEditor;
    const decorations = activeDecorations;

    if (!editor || !decorations) {
        return;
    }

    if (!shouldDecorateLanguage(editor.document.languageId, configuration)) {
        clearEditorDecorations(editor, decorations);
        return;
    }

    const buckets = collectDecorationBuckets(editor, configuration, decorations.indentTypes.length);

    decorations.indentTypes.forEach((type, index) => {
        editor.setDecorations(type, buckets.indentDecorations[index] ?? []);
    });
    editor.setDecorations(decorations.errorType, buckets.errorDecorations);

    if (decorations.tabMixType) {
        editor.setDecorations(decorations.tabMixType, buckets.tabMixDecorations);
    }
}
