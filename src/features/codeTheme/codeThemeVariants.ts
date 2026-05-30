import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type * as vscode from "vscode";
import type { CodeThemeVariant, TextMateRule } from "@/features/codeTheme/codeThemeTypes";

type RawCodeThemeVariant = {
    readonly label?: unknown;
    readonly tokenColors?: unknown;
    readonly semanticTokenColors?: unknown;
};

const variantDirectoryParts = ["assets", "themeSources", "codeVariants"] as const;
const userVariantDirectoryName = "codeThemes";
const variantFileExtension = ".json";
const maxVariantFileCount = 64;

export function readCodeThemeVariants(
    context: vscode.ExtensionContext,
): readonly CodeThemeVariant[] {
    const builtInVariants = readCodeThemeVariantsFromDirectory(
        join(context.extensionPath, ...variantDirectoryParts),
        "builtIn",
    );
    const userVariants = readCodeThemeVariantsFromDirectory(
        join(context.globalStorageUri.fsPath, userVariantDirectoryName),
        "user",
    );

    return [...builtInVariants, ...userVariants];
}

export function getUserCodeThemeVariantsDirectory(context: vscode.ExtensionContext): string {
    return join(context.globalStorageUri.fsPath, userVariantDirectoryName);
}

function readCodeThemeVariantsFromDirectory(
    variantsDirectory: string,
    source: CodeThemeVariant["source"],
): readonly CodeThemeVariant[] {
    if (!existsSync(variantsDirectory)) {
        return [];
    }

    const fileNames = readdirSync(variantsDirectory)
        .filter((fileName) => fileName.endsWith(variantFileExtension))
        .sort((left, right) => left.localeCompare(right))
        .slice(0, maxVariantFileCount);

    return fileNames.map((fileName) => readCodeThemeVariant(variantsDirectory, fileName, source));
}

function readCodeThemeVariant(
    variantsDirectory: string,
    fileName: string,
    source: CodeThemeVariant["source"],
): CodeThemeVariant {
    const filePath = join(variantsDirectory, fileName);
    const rawContent = readFileSync(filePath, "utf8");
    const rawVariant = JSON.parse(rawContent) as RawCodeThemeVariant;
    const label = readLabel(rawVariant, fileName);

    return {
        id: basename(fileName, variantFileExtension),
        label,
        source,
        tokenColors: readTokenColors(rawVariant, label),
        semanticTokenColors: readSemanticTokenColors(rawVariant),
    };
}

function readLabel(rawVariant: RawCodeThemeVariant, fileName: string): string {
    if (typeof rawVariant.label === "string" && rawVariant.label.trim().length > 0) {
        return rawVariant.label;
    }

    return basename(fileName, variantFileExtension);
}

function readTokenColors(rawVariant: RawCodeThemeVariant, label: string): readonly TextMateRule[] {
    if (!Array.isArray(rawVariant.tokenColors)) {
        throw new Error(`Code theme variant "${label}" has no tokenColors array.`);
    }

    return rawVariant.tokenColors.map((rule, index) => readTextMateRule(rule, label, index));
}

function readTextMateRule(rule: unknown, label: string, index: number): TextMateRule {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        throw new Error(`Code theme variant "${label}" has invalid token color rule ${index}.`);
    }

    const candidate = rule as { readonly settings?: unknown };
    if (
        !candidate.settings ||
        typeof candidate.settings !== "object" ||
        Array.isArray(candidate.settings)
    ) {
        throw new Error(`Code theme variant "${label}" has invalid token color settings ${index}.`);
    }

    return rule as TextMateRule;
}

function readSemanticTokenColors(rawVariant: RawCodeThemeVariant): Record<string, unknown> {
    if (
        !rawVariant.semanticTokenColors ||
        typeof rawVariant.semanticTokenColors !== "object" ||
        Array.isArray(rawVariant.semanticTokenColors)
    ) {
        return {};
    }

    return rawVariant.semanticTokenColors as Record<string, unknown>;
}
