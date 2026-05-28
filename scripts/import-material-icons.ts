import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { assertPathExists, upstreamRoot, workspaceRoot } from "./lib/paths";

type FileIconTheme = {
    iconDefinitions: Record<string, { iconPath?: string }>;
};

const upstreamJsonPath = resolve(
    upstreamRoot,
    "vscode-material-icon-theme",
    "dist",
    "material-icons.json",
);
const upstreamIconsPath = resolve(upstreamRoot, "vscode-material-icon-theme", "icons");
const targetJsonPath = resolve(workspaceRoot, "file-icons", "mk-file-icons.json");
const targetIconsPath = resolve(workspaceRoot, "file-icons", "icons");

assertPathExists(upstreamJsonPath, "Material Icon Theme generated JSON");
assertPathExists(upstreamIconsPath, "Material Icon Theme icons");

const theme = readJsonFile(upstreamJsonPath) as FileIconTheme;
const definitions = Object.entries(theme.iconDefinitions);

if (definitions.length === 0) {
    throw new Error("Material Icon Theme has no icon definitions.");
}

for (const [, definition] of definitions) {
    if (definition.iconPath) {
        definition.iconPath = definition.iconPath.replace("./../icons/", "./icons/");
    }
}

if (existsSync(targetIconsPath)) {
    rmSync(targetIconsPath, { recursive: true, force: true });
}

mkdirSync(targetIconsPath, { recursive: true });
cpSync(upstreamIconsPath, targetIconsPath, { recursive: true });
writeJsonFile(targetJsonPath, theme as unknown as JsonValue);

console.log(`Wrote ${targetJsonPath}`);
console.log(`Copied icons to ${targetIconsPath}`);
