import * as vscode from "vscode";
import { clampNumber, readStringArray } from "@/shared/settings";

export type ErrorLensConfiguration = {
    readonly enabled: boolean;
    readonly enabledDiagnosticLevels: readonly vscode.DiagnosticSeverity[];
    readonly messageEnabled: boolean;
    readonly problemRangeDecorationEnabled: boolean;
    readonly messageMaxChars: number;
    readonly messageTemplate: string;
    readonly removeLinebreaks: boolean;
};

const severityMap = new Map<string, vscode.DiagnosticSeverity>([
    ["error", vscode.DiagnosticSeverity.Error],
    ["warning", vscode.DiagnosticSeverity.Warning],
    ["info", vscode.DiagnosticSeverity.Information],
    ["hint", vscode.DiagnosticSeverity.Hint],
]);

export function readErrorLensConfiguration(): ErrorLensConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkErrorLens");
    const levels = readStringArray(configuration, "enabledDiagnosticLevels")
        .map((level) => severityMap.get(level))
        .filter((level): level is vscode.DiagnosticSeverity => level !== undefined);

    return {
        enabled: configuration.get("enabled", true),
        enabledDiagnosticLevels:
            levels.length > 0
                ? levels
                : [
                      vscode.DiagnosticSeverity.Error,
                      vscode.DiagnosticSeverity.Warning,
                      vscode.DiagnosticSeverity.Information,
                  ],
        messageEnabled: configuration.get("messageEnabled", true),
        problemRangeDecorationEnabled: configuration.get("problemRangeDecorationEnabled", false),
        messageMaxChars: clampNumber(configuration.get("messageMaxChars"), 0, 10000, 500),
        messageTemplate: configuration.get("messageTemplate", "$message"),
        removeLinebreaks: configuration.get("removeLinebreaks", true),
    };
}
