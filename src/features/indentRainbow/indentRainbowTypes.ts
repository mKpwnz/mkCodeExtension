import type * as vscode from "vscode";

export type IndicatorStyle = "classic" | "light";

export type ParsedIndentRainbowConfiguration = {
    readonly enabled: boolean;
    readonly includedLanguages: readonly string[];
    readonly excludedLanguages: readonly string[];
    readonly ignoreErrorLanguages: readonly string[];
    readonly updateDelay: number;
    readonly errorColor: string;
    readonly tabmixColor: string;
    readonly ignoreLinePatterns: readonly RegExp[];
    readonly colors: readonly string[];
    readonly colorOnWhiteSpaceOnly: boolean;
    readonly indicatorStyle: IndicatorStyle;
    readonly lightIndicatorStyleLineWidth: number;
    readonly maxLineCount: number;
};

export type DecorationBuckets = {
    readonly indentDecorations: vscode.DecorationOptions[][];
    readonly errorDecorations: vscode.DecorationOptions[];
    readonly tabMixDecorations: vscode.DecorationOptions[];
};

export type ActiveIndentRainbowDecorations = {
    readonly indentTypes: vscode.TextEditorDecorationType[];
    readonly errorType: vscode.TextEditorDecorationType;
    readonly tabMixType: vscode.TextEditorDecorationType | undefined;
};
