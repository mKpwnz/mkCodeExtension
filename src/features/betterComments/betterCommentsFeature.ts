import * as vscode from "vscode";
import { collectBetterCommentRanges } from "@/features/betterComments/betterCommentsAnalysis";
import { readBetterCommentsConfiguration } from "@/features/betterComments/betterCommentsConfiguration";
import {
    type BetterCommentsDecorations,
    createBetterCommentsDecorations,
    disposeBetterCommentsDecorations,
} from "@/features/betterComments/betterCommentsDecorations";

let activeDecorations: BetterCommentsDecorations | undefined;

export function activateBetterComments(context: vscode.ExtensionContext): void {
    rebuildDecorations(context);
    updateVisibleEditors();

    context.subscriptions.push(
        vscode.window.onDidChangeVisibleTextEditors(() => updateVisibleEditors()),
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (
                vscode.window.visibleTextEditors.some(
                    (editor) => editor.document === event.document,
                )
            ) {
                updateVisibleEditors();
            }
        }),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("mkBetterComments")) {
                rebuildDecorations(context);
                updateVisibleEditors();
            }
        }),
    );
}

function rebuildDecorations(context: vscode.ExtensionContext): void {
    disposeBetterCommentsDecorations(activeDecorations);
    activeDecorations = createBetterCommentsDecorations(readBetterCommentsConfiguration());
    context.subscriptions.push(...activeDecorations.types);
}

function updateVisibleEditors(): void {
    const decorations = activeDecorations;
    const configuration = readBetterCommentsConfiguration();

    if (!decorations || !configuration.enabled) {
        clearVisibleEditors(decorations);
        return;
    }

    for (const editor of vscode.window.visibleTextEditors) {
        const ranges = collectBetterCommentRanges(editor, configuration);

        decorations.types.forEach((type, index) => {
            editor.setDecorations(type, ranges[index] ?? []);
        });
    }
}

function clearVisibleEditors(decorations: BetterCommentsDecorations | undefined): void {
    if (!decorations) {
        return;
    }

    for (const editor of vscode.window.visibleTextEditors) {
        decorations.types.forEach((type) => {
            editor.setDecorations(type, []);
        });
    }
}
