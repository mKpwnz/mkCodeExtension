export type TextMateRuleSettings = {
    readonly foreground?: string;
    readonly background?: string;
    readonly fontStyle?: string;
};

export type TextMateRule = {
    readonly name?: string;
    readonly scope?: string | readonly string[];
    readonly settings: TextMateRuleSettings;
};

export type CodeThemeVariant = {
    readonly id: string;
    readonly label: string;
    readonly source: "builtIn" | "user";
    readonly tokenColors: readonly TextMateRule[];
    readonly semanticTokenColors: Record<string, unknown>;
};
