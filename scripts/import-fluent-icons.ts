import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { assertPathExists, ensureParentDirectory, upstreamRoot, workspaceRoot } from "./lib/paths";

type ProductIconTheme = {
    fonts: Array<{
        id: string;
        src: Array<{
            path: string;
            format: string;
        }>;
        weight: string;
        style: string;
    }>;
    iconDefinitions: Record<string, JsonValue>;
};

const upstreamJsonPath = resolve(upstreamRoot, "vscode-fluent-icons", "theme", "fluent-icons.json");
const upstreamFontPath = resolve(upstreamRoot, "vscode-fluent-icons", "theme", "fluent-icons.ttf");
const targetJsonPath = resolve(workspaceRoot, "product-icons", "mk-product-icons.json");
const targetFontPath = resolve(workspaceRoot, "product-icons", "mk-product-icons.ttf");

assertPathExists(upstreamJsonPath, "Fluent Icons theme");
assertPathExists(upstreamFontPath, "Fluent Icons font");

const theme = readJsonFile(upstreamJsonPath) as ProductIconTheme;

if (!Array.isArray(theme.fonts) || theme.fonts.length === 0) {
    throw new Error("Fluent Icons theme has no fonts.");
}

const firstFont = theme.fonts[0];

if (!firstFont) {
    throw new Error("Fluent Icons theme has no first font.");
}

firstFont.id = "mk-product-icons";
firstFont.src = [
    {
        path: "./mk-product-icons.ttf",
        format: "truetype",
    },
];

ensureParentDirectory(targetFontPath);
copyFileSync(upstreamFontPath, targetFontPath);
writeJsonFile(targetJsonPath, theme as unknown as JsonValue);

console.log(`Wrote ${targetJsonPath}`);
console.log(`Wrote ${targetFontPath}`);
