import * as vscode from "vscode";

export type ErrorLensDecorations = {
    readonly messageTypes: ReadonlyMap<vscode.DiagnosticSeverity, vscode.TextEditorDecorationType>;
    readonly rangeTypes: ReadonlyMap<vscode.DiagnosticSeverity, vscode.TextEditorDecorationType>;
};

const severityColors = new Map<
    vscode.DiagnosticSeverity,
    { foreground: string; background: string }
>([
    [vscode.DiagnosticSeverity.Error, { foreground: "#ff6464", background: "#e454541b" }],
    [vscode.DiagnosticSeverity.Warning, { foreground: "#fa973a", background: "#ff942f1b" }],
    [vscode.DiagnosticSeverity.Information, { foreground: "#1acafa", background: "#00b7e420" }],
    [vscode.DiagnosticSeverity.Hint, { foreground: "#17bf6b", background: "#17a2a220" }],
]);

export function createErrorLensDecorations(): ErrorLensDecorations {
    const messageTypes = new Map<vscode.DiagnosticSeverity, vscode.TextEditorDecorationType>();
    const rangeTypes = new Map<vscode.DiagnosticSeverity, vscode.TextEditorDecorationType>();

    for (const [severity, colors] of severityColors.entries()) {
        messageTypes.set(
            severity,
            vscode.window.createTextEditorDecorationType({
                backgroundColor: colors.background,
                isWholeLine: true,
                after: {
                    color: colors.foreground,
                    margin: "0 0 0 4ch",
                    fontStyle: "italic",
                },
            }),
        );
        rangeTypes.set(
            severity,
            vscode.window.createTextEditorDecorationType({
                backgroundColor: colors.background,
            }),
        );
    }

    return { messageTypes, rangeTypes };
}

export function disposeErrorLensDecorations(decorations: ErrorLensDecorations | undefined): void {
    decorations?.messageTypes.forEach((type) => {
        type.dispose();
    });
    decorations?.rangeTypes.forEach((type) => {
        type.dispose();
    });
}
