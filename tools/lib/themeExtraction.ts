import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { JsonValue } from "./json";
import { parseJsonWithComments } from "./jsonc";

export type UpstreamTheme = {
    readonly include?: string;
    readonly tokenColors?: JsonValue[];
    readonly semanticTokenColors?: Record<string, JsonValue>;
};

export function readThemeWithIncludes(themePath: string, depth: number): UpstreamTheme {
    if (depth > 8) {
        throw new Error(`Theme include depth exceeded for ${themePath}`);
    }

    const theme = parseJsonWithComments<UpstreamTheme>(readFileSync(themePath, "utf8"));

    if (!theme.include) {
        return theme;
    }

    const includedPath = resolve(dirname(themePath), theme.include);
    const includedTheme = readThemeWithIncludes(includedPath, depth + 1);

    return {
        tokenColors: [...(includedTheme.tokenColors ?? []), ...(theme.tokenColors ?? [])],
        semanticTokenColors: {
            ...(includedTheme.semanticTokenColors ?? {}),
            ...(theme.semanticTokenColors ?? {}),
        },
    };
}
