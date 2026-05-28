import * as vscode from "vscode";

type IndicatorStyle = "classic" | "light";

type ParsedConfiguration = {
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

type DecorationBuckets = {
    readonly indentDecorations: vscode.DecorationOptions[][];
    readonly errorDecorations: vscode.DecorationOptions[];
    readonly tabMixDecorations: vscode.DecorationOptions[];
};

type ActiveDecorations = {
    readonly indentTypes: vscode.TextEditorDecorationType[];
    readonly errorType: vscode.TextEditorDecorationType;
    readonly tabMixType: vscode.TextEditorDecorationType | undefined;
};

let activeDecorations: ActiveDecorations | undefined;
let updateTimeout: ReturnType<typeof setTimeout> | undefined;

export function activateIndentRainbow(context: vscode.ExtensionContext): void {
    rebuildDecorations(context);
    scheduleActiveEditorUpdate();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => scheduleActiveEditorUpdate()),
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
    activeDecorations?.indentTypes.forEach((type) => {
        type.dispose();
    });
    activeDecorations?.errorType.dispose();
    activeDecorations?.tabMixType?.dispose();

    const configuration = readConfiguration();
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

    activeDecorations = {
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

    context.subscriptions.push(...indentTypes, activeDecorations.errorType);

    if (activeDecorations.tabMixType) {
        context.subscriptions.push(activeDecorations.tabMixType);
    }
}

function scheduleActiveEditorUpdate(): void {
    const configuration = readConfiguration();

    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => updateActiveEditor(configuration), configuration.updateDelay);
}

function updateActiveEditor(configuration: ParsedConfiguration): void {
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

function clearEditorDecorations(editor: vscode.TextEditor, decorations: ActiveDecorations): void {
    decorations.indentTypes.forEach((type) => {
        editor.setDecorations(type, []);
    });
    editor.setDecorations(decorations.errorType, []);

    if (decorations.tabMixType) {
        editor.setDecorations(decorations.tabMixType, []);
    }
}

function collectDecorationBuckets(
    editor: vscode.TextEditor,
    configuration: ParsedConfiguration,
    colorCount: number,
): DecorationBuckets {
    const tabSize = getTabSize(editor.options.tabSize ?? 4);
    const maxLines = Math.min(editor.document.lineCount, configuration.maxLineCount);
    const ignoreErrors = shouldIgnoreErrors(editor.document.languageId, configuration);
    const indentDecorations = Array.from(
        { length: colorCount },
        () => [] as vscode.DecorationOptions[],
    );
    const errorDecorations: vscode.DecorationOptions[] = [];
    const tabMixDecorations: vscode.DecorationOptions[] = [];

    for (let lineNumber = 0; lineNumber < maxLines; lineNumber += 1) {
        const line = editor.document.lineAt(lineNumber);
        const leadingWhitespace = line.text.match(/^[\t ]+/)?.[0] ?? "";

        if (leadingWhitespace.length === 0) {
            continue;
        }

        const lineIgnoresErrors =
            ignoreErrors ||
            configuration.ignoreLinePatterns.some((pattern) => pattern.test(line.text));
        const visualWidth = calculateVisualWidth(leadingWhitespace, tabSize);

        if (!lineIgnoresErrors && visualWidth % tabSize !== 0) {
            errorDecorations.push({
                range: new vscode.Range(lineNumber, 0, lineNumber, leadingWhitespace.length),
            });
            continue;
        }

        const mixedIndentDecorations =
            !lineIgnoresErrors && hasMixedIndentation(leadingWhitespace)
                ? tabMixDecorations
                : undefined;

        collectLineDecorations(
            lineNumber,
            leadingWhitespace,
            tabSize,
            configuration.colorOnWhiteSpaceOnly,
            indentDecorations,
            mixedIndentDecorations,
        );
    }

    return {
        indentDecorations,
        errorDecorations,
        tabMixDecorations,
    };
}

function collectLineDecorations(
    lineNumber: number,
    leadingWhitespace: string,
    tabSize: number,
    colorOnWhiteSpaceOnly: boolean,
    indentDecorations: vscode.DecorationOptions[][],
    tabMixDecorations: vscode.DecorationOptions[] | undefined,
): void {
    let characterOffset = 0;
    let visualOffset = 0;
    let indentLevel = 0;

    while (characterOffset < leadingWhitespace.length) {
        const segmentStart = characterOffset;
        const segmentEndVisual = visualOffset + tabSize;

        while (characterOffset < leadingWhitespace.length && visualOffset < segmentEndVisual) {
            const character = leadingWhitespace[characterOffset];
            characterOffset += 1;
            visualOffset += character === "\t" ? tabSize : 1;
        }

        const segmentEnd = colorOnWhiteSpaceOnly
            ? Math.min(characterOffset, leadingWhitespace.length)
            : characterOffset;
        const decoration = {
            range: new vscode.Range(lineNumber, segmentStart, lineNumber, segmentEnd),
        };

        if (tabMixDecorations) {
            tabMixDecorations.push(decoration);
        } else {
            const colorIndex = indentLevel % indentDecorations.length;
            indentDecorations[colorIndex]?.push(decoration);
        }

        indentLevel += 1;
    }
}

function shouldDecorateLanguage(languageId: string, configuration: ParsedConfiguration): boolean {
    if (
        configuration.includedLanguages.length > 0 &&
        !configuration.includedLanguages.includes(languageId)
    ) {
        return false;
    }

    return !configuration.excludedLanguages.includes(languageId);
}

function shouldIgnoreErrors(languageId: string, configuration: ParsedConfiguration): boolean {
    return (
        configuration.ignoreErrorLanguages.includes("*") ||
        configuration.ignoreErrorLanguages.includes(languageId)
    );
}

function calculateVisualWidth(leadingWhitespace: string, tabSize: number): number {
    let width = 0;

    for (const character of leadingWhitespace) {
        width += character === "\t" ? tabSize : 1;
    }

    return width;
}

function hasMixedIndentation(leadingWhitespace: string): boolean {
    return leadingWhitespace.includes("\t") && leadingWhitespace.includes(" ");
}

function getTabSize(tabSize: string | number): number {
    if (typeof tabSize === "number" && Number.isFinite(tabSize) && tabSize > 0) {
        return Math.min(Math.trunc(tabSize), 16);
    }

    return 4;
}

function readConfiguration(): ParsedConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkIndentRainbow");
    const configuredColors = readStringArray(configuration, "colors");

    return {
        includedLanguages: readStringArray(configuration, "includedLanguages"),
        excludedLanguages: readStringArray(configuration, "excludedLanguages"),
        ignoreErrorLanguages: readStringArray(configuration, "ignoreErrorLanguages"),
        updateDelay: clampNumber(configuration.get("updateDelay"), 0, 2000, 100),
        errorColor: configuration.get("errorColor", "rgba(128,32,32,0.45)"),
        tabmixColor: configuration.get("tabmixColor", "rgba(128,32,96,0.45)"),
        ignoreLinePatterns: readRegExpArray(configuration, "ignoreLinePatterns"),
        colors:
            configuredColors.length > 0
                ? configuredColors
                : [
                      "rgba(73,151,250,0.08)",
                      "rgba(18,184,162,0.08)",
                      "rgba(224,153,45,0.08)",
                      "rgba(134,134,209,0.08)",
                  ],
        colorOnWhiteSpaceOnly: configuration.get("colorOnWhiteSpaceOnly", false),
        indicatorStyle: readIndicatorStyle(configuration),
        lightIndicatorStyleLineWidth: clampNumber(
            configuration.get("lightIndicatorStyleLineWidth"),
            1,
            8,
            1,
        ),
        maxLineCount: clampNumber(configuration.get("maxLineCount"), 100, 100000, 20000),
    };
}

function readStringArray(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
): readonly string[] {
    const value = configuration.get<unknown>(key);

    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function readRegExpArray(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
): readonly RegExp[] {
    return readStringArray(configuration, key)
        .map((pattern) => parseRegExp(pattern))
        .filter((pattern): pattern is RegExp => pattern !== undefined);
}

function parseRegExp(pattern: string): RegExp | undefined {
    const match = pattern.match(/^\/(.*?)\/([gimuy]*)$/);

    try {
        if (match) {
            return new RegExp(match[1] ?? "", match[2] ?? "");
        }

        return new RegExp(pattern);
    } catch {
        return undefined;
    }
}

function readIndicatorStyle(configuration: vscode.WorkspaceConfiguration): IndicatorStyle {
    const value = configuration.get("indicatorStyle", "classic");

    if (value === "classic" || value === "light") {
        return value;
    }

    return "classic";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(Math.max(Math.trunc(value), min), max);
}
