import * as vscode from "vscode";
import { readErrorLensConfiguration } from "@/features/errorLens/errorLensConfiguration";
import {
    createErrorLensDecorations,
    disposeErrorLensDecorations,
    type ErrorLensDecorations,
} from "@/features/errorLens/errorLensDecorations";

let activeDecorations: ErrorLensDecorations | undefined;

export function activateErrorLens(context: vscode.ExtensionContext): void {
    activeDecorations = createErrorLensDecorations();
    context.subscriptions.push(
        ...activeDecorations.messageTypes.values(),
        ...activeDecorations.rangeTypes.values(),
        vscode.languages.onDidChangeDiagnostics(() => updateVisibleEditors()),
        vscode.window.onDidChangeVisibleTextEditors(() => updateVisibleEditors()),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("mkErrorLens")) {
                updateVisibleEditors();
            }
        }),
        vscode.commands.registerCommand("mkErrorLens.copyProblemMessage", () =>
            copyActiveProblemMessage(),
        ),
    );

    updateVisibleEditors();
}

export function deactivateErrorLens(): void {
    disposeErrorLensDecorations(activeDecorations);
}

function updateVisibleEditors(): void {
    const decorations = activeDecorations;
    const configuration = readErrorLensConfiguration();

    if (!decorations) {
        return;
    }

    for (const editor of vscode.window.visibleTextEditors) {
        clearEditor(editor, decorations);

        if (!configuration.enabled) {
            continue;
        }

        const diagnostics = vscode.languages
            .getDiagnostics(editor.document.uri)
            .filter((diagnostic) =>
                configuration.enabledDiagnosticLevels.includes(diagnostic.severity),
            );
        const messageBuckets = createBuckets();
        const rangeBuckets = createBuckets();

        for (const diagnostic of diagnostics.slice(
            0,
            configuration.messageMaxChars === 0 ? 0 : 1000,
        )) {
            if (configuration.messageEnabled) {
                messageBuckets.get(diagnostic.severity)?.push({
                    range: getLineEndRange(editor.document, diagnostic.range.start.line),
                    renderOptions: {
                        after: {
                            contentText: ` ${formatDiagnosticMessage(diagnostic, configuration)}`,
                        },
                    },
                });
            }

            if (configuration.problemRangeDecorationEnabled) {
                rangeBuckets.get(diagnostic.severity)?.push({ range: diagnostic.range });
            }
        }

        applyBuckets(editor, decorations.messageTypes, messageBuckets);
        applyBuckets(editor, decorations.rangeTypes, rangeBuckets);
    }
}

function clearEditor(editor: vscode.TextEditor, decorations: ErrorLensDecorations): void {
    decorations.messageTypes.forEach((type) => {
        editor.setDecorations(type, []);
    });
    decorations.rangeTypes.forEach((type) => {
        editor.setDecorations(type, []);
    });
}

function createBuckets(): Map<vscode.DiagnosticSeverity, vscode.DecorationOptions[]> {
    return new Map([
        [vscode.DiagnosticSeverity.Error, []],
        [vscode.DiagnosticSeverity.Warning, []],
        [vscode.DiagnosticSeverity.Information, []],
        [vscode.DiagnosticSeverity.Hint, []],
    ]);
}

function applyBuckets(
    editor: vscode.TextEditor,
    types: ReadonlyMap<vscode.DiagnosticSeverity, vscode.TextEditorDecorationType>,
    buckets: ReadonlyMap<vscode.DiagnosticSeverity, readonly vscode.DecorationOptions[]>,
): void {
    types.forEach((type, severity) => {
        editor.setDecorations(type, buckets.get(severity) ?? []);
    });
}

function getLineEndRange(document: vscode.TextDocument, lineNumber: number): vscode.Range {
    const line = document.lineAt(lineNumber);

    return new vscode.Range(
        lineNumber,
        line.range.end.character,
        lineNumber,
        line.range.end.character,
    );
}

function formatDiagnosticMessage(
    diagnostic: vscode.Diagnostic,
    configuration: ReturnType<typeof readErrorLensConfiguration>,
): string {
    const source = diagnostic.source ?? "";
    const code = typeof diagnostic.code === "object" ? diagnostic.code.value : diagnostic.code;
    let message = diagnostic.message;

    if (configuration.removeLinebreaks) {
        message = message.replaceAll(/\s+/g, " ");
    }

    if (configuration.messageMaxChars > 0 && message.length > configuration.messageMaxChars) {
        message = `${message.slice(0, configuration.messageMaxChars)}...`;
    }

    return configuration.messageTemplate
        .replaceAll("$message", message)
        .replaceAll("$source", source)
        .replaceAll("$code", code === undefined ? "" : String(code));
}

async function copyActiveProblemMessage(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const diagnostic = vscode.languages
        .getDiagnostics(editor.document.uri)
        .find((item) => item.range.start.line === editor.selection.active.line);

    if (diagnostic) {
        await vscode.env.clipboard.writeText(diagnostic.message);
    }
}
