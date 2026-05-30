import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { type JsonValue, writeJsonFile } from "./lib/json";
import { assertPathExists, upstreamRoot, workspaceRoot } from "./lib/paths";
import { readThemeWithIncludes } from "./lib/themeExtraction";

type CodeThemeImport = {
    label: string;
    sourcePath: string;
    targetFileName: string;
};

const codeVariantsPath = resolve(workspaceRoot, "assets", "themeSources", "codeVariants");

function resolveDefaultThemePath(fileName: string): string {
    const localAppData = process.env.LOCALAPPDATA ?? "";
    const codeInstallPath = resolve(localAppData, "Programs", "Microsoft VS Code");
    const directPath = resolve(
        codeInstallPath,
        "resources",
        "app",
        "extensions",
        "theme-defaults",
        "themes",
    );

    if (existsSync(directPath)) {
        return resolve(directPath, fileName);
    }

    if (existsSync(codeInstallPath)) {
        const installDirectories = readdirSync(codeInstallPath, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => join(codeInstallPath, entry.name))
            .slice(0, 100);

        for (const installDirectory of installDirectories) {
            const themePath = resolve(
                installDirectory,
                "resources",
                "app",
                "extensions",
                "theme-defaults",
                "themes",
            );

            if (existsSync(themePath)) {
                return resolve(themePath, fileName);
            }
        }
    }

    return resolve(upstreamRoot, "vscode-theme-defaults", "themes", fileName);
}

const imports: CodeThemeImport[] = [
    {
        label: "mK Theme Dark Copilot Code",
        sourcePath: resolve(
            upstreamRoot,
            "copilot-theme",
            "themes",
            "Copilot Theme-color-theme.json",
        ),
        targetFileName: "copilot.json",
    },
    {
        label: "mK Theme Dark One Dark Pro Code",
        sourcePath: resolve(upstreamRoot, "OneDark-Pro", "themes", "OneDark-Pro.json"),
        targetFileName: "oneDarkPro.json",
    },
    {
        label: "mK Theme Dark Atom One Dark Code",
        sourcePath: resolve(upstreamRoot, "vscode-theme-onedark", "themes", "OneDark.json"),
        targetFileName: "atomOneDark.json",
    },
    {
        label: "mK Theme Dark Dracula Code",
        sourcePath: resolve(upstreamRoot, "dracula-visual-studio-code", "theme", "dracula.json"),
        targetFileName: "dracula.json",
    },
    {
        label: "mK Theme Dark VS Code 2026 Dark Code",
        sourcePath: resolveDefaultThemePath("2026-dark.json"),
        targetFileName: "vsCode2026Dark.json",
    },
    {
        label: "mK Theme Dark VS Code Dark+ Code",
        sourcePath: resolveDefaultThemePath("dark_plus.json"),
        targetFileName: "vsCodeDarkPlus.json",
    },
    {
        label: "mK Theme Dark VS Code Dark Modern Code",
        sourcePath: resolveDefaultThemePath("dark_modern.json"),
        targetFileName: "vsCodeDarkModern.json",
    },
    {
        label: "mK Theme Dark VS Code Visual Studio Dark Code",
        sourcePath: resolveDefaultThemePath("dark_vs.json"),
        targetFileName: "vsCodeVisualStudioDark.json",
    },
    {
        label: "mK Theme Dark VS Code High Contrast Code",
        sourcePath: resolveDefaultThemePath("hc_black.json"),
        targetFileName: "vsCodeHighContrast.json",
    },
];

function readCodeTheme(themeImport: CodeThemeImport): JsonValue {
    assertPathExists(themeImport.sourcePath, themeImport.label);

    const upstreamTheme = readThemeWithIncludes(themeImport.sourcePath, 0);
    const tokenColors = upstreamTheme.tokenColors ?? [];
    const semanticTokenColors = upstreamTheme.semanticTokenColors ?? {};

    if (tokenColors.length === 0) {
        throw new Error(`${themeImport.label} has no token colors.`);
    }

    return {
        label: themeImport.label,
        tokenColors,
        semanticTokenColors,
    };
}

for (const themeImport of imports) {
    const targetPath = resolve(codeVariantsPath, themeImport.targetFileName);
    const codeTheme = readCodeTheme(themeImport);

    writeJsonFile(targetPath, codeTheme);
    console.log(`Wrote ${targetPath}`);
}
