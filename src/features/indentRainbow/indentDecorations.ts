import * as vscode from "vscode";
import type {
    ActiveIndentRainbowDecorations,
    ParsedIndentRainbowConfiguration,
} from "@/features/indentRainbow/indentRainbowTypes";

export function createIndentRainbowDecorations(
    configuration: ParsedIndentRainbowConfiguration,
): ActiveIndentRainbowDecorations {
    const indentTypes = configuration.colors.map((color) => {
        if (configuration.indicatorStyle === "light") {
            return vscode.window.createTextEditorDecorationType({
                borderColor: color,
                borderStyle: "solid",
                borderWidth: `0 0 0 ${configuration.lightIndicatorStyleLineWidth}px`,
            });
        }

        return vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
        });
    });

    return {
        indentTypes,
        errorType: vscode.window.createTextEditorDecorationType({
            backgroundColor: configuration.errorColor,
        }),
        tabMixType:
            configuration.tabmixColor.length > 0
                ? vscode.window.createTextEditorDecorationType({
                      backgroundColor: configuration.tabmixColor,
                  })
                : undefined,
    };
}

export function disposeIndentRainbowDecorations(
    decorations: ActiveIndentRainbowDecorations | undefined,
): void {
    decorations?.indentTypes.forEach((type) => {
        type.dispose();
    });
    decorations?.errorType.dispose();
    decorations?.tabMixType?.dispose();
}

export function clearEditorDecorations(
    editor: vscode.TextEditor,
    decorations: ActiveIndentRainbowDecorations,
): void {
    decorations.indentTypes.forEach((type) => {
        editor.setDecorations(type, []);
    });
    editor.setDecorations(decorations.errorType, []);

    if (decorations.tabMixType) {
        editor.setDecorations(decorations.tabMixType, []);
    }
}
