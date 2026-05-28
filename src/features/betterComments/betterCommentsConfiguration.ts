import * as vscode from "vscode";
import type {
    BetterCommentsConfiguration,
    BetterCommentTag,
} from "@/features/betterComments/betterCommentsTypes";
import { clampNumber } from "@/shared/settings";

const defaultTags: readonly BetterCommentTag[] = [
    makeTag("!", "#ff6464"),
    makeTag("?", "#1acafa"),
    { ...makeTag("//", "#6f747c"), strikethrough: true },
    makeTag("todo", "#ffc632"),
    makeTag("*", "#17bf6b"),
];

export function readBetterCommentsConfiguration(): BetterCommentsConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkBetterComments");

    return {
        enabled: configuration.get("enabled", true),
        multilineComments: configuration.get("multilineComments", true),
        highlightPlainText: configuration.get("highlightPlainText", false),
        maxLineCount: clampNumber(configuration.get("maxLineCount"), 100, 100000, 20000),
        tags: readTags(configuration.get("tags", defaultTags)),
    };
}

function readTags(value: unknown): readonly BetterCommentTag[] {
    if (!Array.isArray(value)) {
        return defaultTags;
    }

    const tags: BetterCommentTag[] = [];

    for (const item of value.slice(0, 64)) {
        if (!item || typeof item !== "object") {
            continue;
        }

        const record = item as Record<string, unknown>;
        const tag = typeof record.tag === "string" ? record.tag : "";
        const color = typeof record.color === "string" ? record.color : "#ffffff";

        if (tag.length === 0) {
            continue;
        }

        tags.push({
            tag,
            color,
            backgroundColor:
                typeof record.backgroundColor === "string" ? record.backgroundColor : "transparent",
            strikethrough: record.strikethrough === true,
            underline: record.underline === true,
            bold: record.bold === true,
            italic: record.italic === true,
        });
    }

    return tags.length > 0 ? tags : defaultTags;
}

function makeTag(tag: string, color: string): BetterCommentTag {
    return {
        tag,
        color,
        backgroundColor: "transparent",
        strikethrough: false,
        underline: false,
        bold: false,
        italic: false,
    };
}
