export type BetterCommentTag = {
    readonly tag: string;
    readonly color: string;
    readonly backgroundColor: string;
    readonly strikethrough: boolean;
    readonly underline: boolean;
    readonly bold: boolean;
    readonly italic: boolean;
};

export type BetterCommentsConfiguration = {
    readonly enabled: boolean;
    readonly multilineComments: boolean;
    readonly highlightPlainText: boolean;
    readonly maxLineCount: number;
    readonly tags: readonly BetterCommentTag[];
};
