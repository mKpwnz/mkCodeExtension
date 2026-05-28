import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readJsonFile } from "./lib/json";
import { workspaceRoot } from "./lib/paths";

type PackageJson = {
    contributes?: {
        themes?: Array<{ label: string; path: string }>;
        productIconThemes?: Array<{ id: string; label: string; path: string }>;
        iconThemes?: Array<{ id: string; label: string; path: string }>;
    };
};

type IconTheme = {
    fonts?: Array<{ src?: Array<{ path?: string }> }>;
    iconDefinitions?: Record<string, { iconPath?: string }>;
};

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFile(path: string): void {
    assert(existsSync(path), `Missing file: ${path}`);
}

function resolveContributionPath(relativePath: string): string {
    return resolve(workspaceRoot, relativePath);
}

const packageJson = readJsonFile(resolve(workspaceRoot, "package.json")) as PackageJson;
const themes = packageJson.contributes?.themes ?? [];
const productIconThemes = packageJson.contributes?.productIconThemes ?? [];
const iconThemes = packageJson.contributes?.iconThemes ?? [];

assert(
    themes.some((theme) => theme.label === "mK Theme Dark"),
    "Missing mK Theme Dark.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark Copilot Code"),
    "Missing mK Theme Dark Copilot Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark One Dark Pro Code"),
    "Missing mK Theme Dark One Dark Pro Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark Atom One Dark Code"),
    "Missing mK Theme Dark Atom One Dark Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark Dracula Code"),
    "Missing mK Theme Dark Dracula Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark VS Code 2026 Dark Code"),
    "Missing mK Theme Dark VS Code 2026 Dark Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark VS Code Dark+ Code"),
    "Missing mK Theme Dark VS Code Dark+ Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark VS Code Dark Modern Code"),
    "Missing mK Theme Dark VS Code Dark Modern Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark VS Code Visual Studio Dark Code"),
    "Missing mK Theme Dark VS Code Visual Studio Dark Code.",
);
assert(
    themes.some((theme) => theme.label === "mK Theme Dark VS Code High Contrast Code"),
    "Missing mK Theme Dark VS Code High Contrast Code.",
);
assert(
    productIconThemes.some((theme) => theme.id === "mk-product-icons"),
    "Missing mK Product Icons.",
);
assert(
    iconThemes.some((theme) => theme.id === "mk-file-icons"),
    "Missing mK File Icons.",
);

for (const theme of themes) {
    assertFile(resolveContributionPath(theme.path));
}

for (const theme of productIconThemes) {
    const themePath = resolveContributionPath(theme.path);
    const themeDirectory = dirname(themePath);
    const iconTheme = readJsonFile(themePath) as IconTheme;

    assertFile(themePath);

    for (const font of iconTheme.fonts ?? []) {
        for (const source of font.src ?? []) {
            if (source.path) {
                assertFile(resolve(themeDirectory, source.path));
            }
        }
    }
}

for (const theme of iconThemes) {
    const themePath = resolveContributionPath(theme.path);
    const themeDirectory = dirname(themePath);
    const iconTheme = readJsonFile(themePath) as IconTheme;

    assertFile(themePath);

    for (const definition of Object.values(iconTheme.iconDefinitions ?? {})) {
        if (definition.iconPath) {
            assertFile(resolve(themeDirectory, definition.iconPath));
        }
    }
}

const packageContent = readFileSync(resolve(workspaceRoot, "package.json"), "utf8");
assert(!packageContent.includes('"fluent-icons"'), "Found upstream Fluent id in package.json.");
assert(
    !packageContent.includes('"material-icon-theme"'),
    "Found upstream Material id in package.json.",
);

const notices = readFileSync(resolve(workspaceRoot, "docs", "THIRD_PARTY_NOTICES.md"), "utf8");
assert(notices.includes("Apache-2.0"), "Third-party notices must include Apache-2.0.");
assert(notices.includes("MIT"), "Third-party notices must include MIT.");
assert(notices.includes("leolin-idah/intellij-elegant-theme"), "Missing ElegantTheme notice.");
assert(notices.includes("benjaminbenais/copilot-theme"), "Missing Copilot Theme notice.");
assert(notices.includes("Binaryify/OneDark-Pro"), "Missing One Dark Pro notice.");
assert(notices.includes("akamud/vscode-theme-onedark"), "Missing Atom One Dark notice.");
assert(notices.includes("dracula/visual-studio-code"), "Missing Dracula notice.");
assert(notices.includes("microsoft/vscode"), "Missing VS Code default themes notice.");
assert(notices.includes("miguelsolorio/vscode-fluent-icons"), "Missing Fluent Icons notice.");
assert(
    notices.includes("material-extensions/vscode-material-icon-theme"),
    "Missing Material Icon Theme notice.",
);
assert(notices.includes("oderwat/vscode-indent-rainbow"), "Missing Indent Rainbow notice.");
assert(notices.includes("aaron-bond/better-comments"), "Missing Better Comments notice.");
assert(notices.includes("usernamehw/vscode-error-lens"), "Missing Error Lens notice.");
assert(
    notices.includes("bendera/vscode-commit-message-editor"),
    "Missing Commit Message Editor notice.",
);
assert(notices.includes("ChristianKohler/PathIntellisense"), "Missing Path Intellisense notice.");

const biome = readJsonFile(resolve(workspaceRoot, "biome.json")) as {
    formatter?: { indentWidth?: number };
};
assert(biome.formatter?.indentWidth === 4, "Biome must use 4 spaces.");

const tsconfig = readJsonFile(resolve(workspaceRoot, "tsconfig.json")) as {
    compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
};
const srcAliasTargets = tsconfig.compilerOptions?.paths?.["@/*"] ?? [];
assert(tsconfig.compilerOptions?.baseUrl === ".", "tsconfig must set baseUrl to workspace root.");
assert(srcAliasTargets.includes("./src/*"), "tsconfig must map @/* to ./src/*.");

console.log("Extension validation passed.");
