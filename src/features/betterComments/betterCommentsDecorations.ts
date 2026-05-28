import * as vscode from "vscode";
import type {
    BetterCommentsConfiguration,
    BetterCommentTag,
} from "@/features/betterComments/betterCommentsTypes";

export type BetterCommentsDecorations = {
    readonly types: readonly vscode.TextEditorDecorationType[];
    readonly tags: readonly BetterCommentTag[];
};

export function createBetterCommentsDecorations(
    configuration: BetterCommentsConfiguration,
): BetterCommentsDecorations {
    return {
        tags: configuration.tags,
        types: configuration.tags.map((tag) =>
            vscode.window.createTextEditorDecorationType(buildOptions(tag)),
        ),
    };
}

export function disposeBetterCommentsDecorations(
    decorations: BetterCommentsDecorations | undefined,
): void {
    decorations?.types.forEach((type) => {
        type.dispose();
    });
}

function buildTextDecoration(tag: BetterCommentTag): string | undefined {
    const values: string[] = [];

    if (tag.underline) {
        values.push("underline");
    }

    if (tag.strikethrough) {
        values.push("line-through");
    }

    return values.length > 0 ? values.join(" ") : undefined;
}

function buildOptions(tag: BetterCommentTag): vscode.DecorationRenderOptions {
    const options: vscode.DecorationRenderOptions = {
        backgroundColor: tag.backgroundColor,
        color: tag.color,
    };
    const textDecoration = buildTextDecoration(tag);

    if (tag.italic) {
        options.fontStyle = "italic";
    }

    if (tag.bold) {
        options.fontWeight = "bold";
    }

    if (textDecoration) {
        options.textDecoration = textDecoration;
    }

    return options;
}
