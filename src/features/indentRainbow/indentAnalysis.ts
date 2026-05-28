import * as vscode from "vscode";
import type {
    DecorationBuckets,
    ParsedIndentRainbowConfiguration,
} from "@/features/indentRainbow/indentRainbowTypes";

export function shouldDecorateLanguage(
    languageId: string,
    configuration: ParsedIndentRainbowConfiguration,
): boolean {
    if (
        configuration.includedLanguages.length > 0 &&
        !configuration.includedLanguages.includes(languageId)
    ) {
        return false;
    }

    return !configuration.excludedLanguages.includes(languageId);
}

export function collectDecorationBuckets(
    editor: vscode.TextEditor,
    configuration: ParsedIndentRainbowConfiguration,
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

function shouldIgnoreErrors(
    languageId: string,
    configuration: ParsedIndentRainbowConfiguration,
): boolean {
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
