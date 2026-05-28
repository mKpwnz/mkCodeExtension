import * as vscode from "vscode";
import type { BetterCommentsConfiguration } from "@/features/betterComments/betterCommentsTypes";

const singleLinePrefixes = ["//", "#", "--", ";", "%"];
const blockCommentPairs = [
    { start: "/*", end: "*/" },
    { start: "<!--", end: "-->" },
];

export function collectBetterCommentRanges(
    editor: vscode.TextEditor,
    configuration: BetterCommentsConfiguration,
): vscode.Range[][] {
    const buckets = configuration.tags.map(() => [] as vscode.Range[]);
    const maxLines = Math.min(editor.document.lineCount, configuration.maxLineCount);
    let blockDepth = 0;

    for (let lineNumber = 0; lineNumber < maxLines; lineNumber += 1) {
        const text = editor.document.lineAt(lineNumber).text;
        const commentStart = getCommentStart(text, blockDepth > 0, configuration);

        if (commentStart !== undefined) {
            collectLineRanges(text, lineNumber, commentStart, configuration, buckets);
        }

        blockDepth = updateBlockDepth(text, blockDepth, configuration.multilineComments);
    }

    return buckets;
}

function getCommentStart(
    text: string,
    insideBlock: boolean,
    configuration: BetterCommentsConfiguration,
): number | undefined {
    if (configuration.highlightPlainText) {
        return 0;
    }

    if (insideBlock) {
        return 0;
    }

    let start: number | undefined;

    for (const prefix of singleLinePrefixes) {
        const index = text.indexOf(prefix);

        if (index >= 0 && (start === undefined || index < start)) {
            start = index + prefix.length;
        }
    }

    for (const pair of blockCommentPairs) {
        const index = text.indexOf(pair.start);

        if (index >= 0 && (start === undefined || index < start)) {
            start = index + pair.start.length;
        }
    }

    return start;
}

function collectLineRanges(
    text: string,
    lineNumber: number,
    commentStart: number,
    configuration: BetterCommentsConfiguration,
    buckets: vscode.Range[][],
): void {
    const searchableText = text.slice(commentStart).toLocaleLowerCase();

    configuration.tags.forEach((tag, index) => {
        const tagIndex = searchableText.indexOf(tag.tag.toLocaleLowerCase());

        if (tagIndex < 0) {
            return;
        }

        const start = commentStart + tagIndex;
        const end = text.length;
        buckets[index]?.push(new vscode.Range(lineNumber, start, lineNumber, end));
    });
}

function updateBlockDepth(text: string, currentDepth: number, enabled: boolean): number {
    if (!enabled) {
        return 0;
    }

    let nextDepth = currentDepth;

    for (const pair of blockCommentPairs) {
        if (text.includes(pair.start)) {
            nextDepth += 1;
        }

        if (text.includes(pair.end)) {
            nextDepth = Math.max(0, nextDepth - 1);
        }
    }

    return nextDepth;
}
