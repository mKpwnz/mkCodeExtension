import { resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { workspaceRoot } from "./lib/paths";

type CodeThemeVariant = {
    label: string;
    outputPath: string;
    tokenColors: JsonValue[];
    semanticTokenColors: Record<string, JsonValue>;
};

const targetVariantPath = resolve(
    workspaceRoot,
    "assets",
    "themeSources",
    "codeVariants",
    "elegant.json",
);

const variant = readJsonFile(targetVariantPath) as CodeThemeVariant;

if (variant.label !== "mK Theme Dark") {
    throw new Error(`Unexpected Elegant code theme label: ${variant.label}`);
}

if (variant.outputPath !== "mkThemeDarkColorTheme.json") {
    throw new Error(`Unexpected Elegant code theme output: ${variant.outputPath}`);
}

if (!Array.isArray(variant.tokenColors) || variant.tokenColors.length === 0) {
    throw new Error("Elegant code theme token colors are missing.");
}

writeJsonFile(targetVariantPath, variant);

console.log(`Wrote ${targetVariantPath}`);
