import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { workspaceRoot } from "./lib/paths";

type ThemeBase = {
    type: string;
    semanticHighlighting: boolean;
    colors: Record<string, string>;
};

type ThemeVariant = {
    label: string;
    outputPath: string;
    tokenColors: JsonValue[];
    semanticTokenColors: Record<string, JsonValue>;
};

const themeSourcesPath = resolve(workspaceRoot, "assets", "themeSources");
const variantsPath = resolve(themeSourcesPath, "codeVariants");
const outputDirectory = resolve(workspaceRoot, "assets", "themes");
const base = readJsonFile(resolve(themeSourcesPath, "baseWorkbenchColors.json")) as ThemeBase;
const variantFiles = readdirSync(variantsPath)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

for (const variantFile of variantFiles) {
    const variant = readJsonFile(resolve(variantsPath, variantFile)) as ThemeVariant;
    const theme: JsonValue = {
        name: variant.label,
        type: base.type,
        semanticHighlighting: base.semanticHighlighting,
        colors: base.colors,
        tokenColors: variant.tokenColors,
        semanticTokenColors: variant.semanticTokenColors,
    };

    writeJsonFile(resolve(outputDirectory, variant.outputPath), theme);
    console.log(`Wrote ${variant.outputPath}`);
}
