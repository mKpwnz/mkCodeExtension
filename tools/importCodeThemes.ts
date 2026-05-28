import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { assertPathExists, upstreamRoot, workspaceRoot } from "./lib/paths";

type UpstreamTheme = {
    include?: string;
    tokenColors?: JsonValue[];
    semanticTokenColors?: Record<string, JsonValue>;
};

type CodeThemeImport = {
    label: string;
    outputPath: string;
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
        outputPath: "mkThemeDarkCopilotCodeTheme.json",
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
        outputPath: "mkThemeDarkOneDarkProCodeTheme.json",
        sourcePath: resolve(upstreamRoot, "OneDark-Pro", "themes", "OneDark-Pro.json"),
        targetFileName: "oneDarkPro.json",
    },
    {
        label: "mK Theme Dark Atom One Dark Code",
        outputPath: "mkThemeDarkAtomOneDarkCodeTheme.json",
        sourcePath: resolve(upstreamRoot, "vscode-theme-onedark", "themes", "OneDark.json"),
        targetFileName: "atomOneDark.json",
    },
    {
        label: "mK Theme Dark Dracula Code",
        outputPath: "mkThemeDarkDraculaCodeTheme.json",
        sourcePath: resolve(upstreamRoot, "dracula-visual-studio-code", "theme", "dracula.json"),
        targetFileName: "dracula.json",
    },
    {
        label: "mK Theme Dark VS Code 2026 Dark Code",
        outputPath: "mkThemeDarkVsCode2026DarkCodeTheme.json",
        sourcePath: resolveDefaultThemePath("2026-dark.json"),
        targetFileName: "vsCode2026Dark.json",
    },
    {
        label: "mK Theme Dark VS Code Dark+ Code",
        outputPath: "mkThemeDarkVsCodeDarkPlusCodeTheme.json",
        sourcePath: resolveDefaultThemePath("dark_plus.json"),
        targetFileName: "vsCodeDarkPlus.json",
    },
    {
        label: "mK Theme Dark VS Code Dark Modern Code",
        outputPath: "mkThemeDarkVsCodeDarkModernCodeTheme.json",
        sourcePath: resolveDefaultThemePath("dark_modern.json"),
        targetFileName: "vsCodeDarkModern.json",
    },
    {
        label: "mK Theme Dark VS Code Visual Studio Dark Code",
        outputPath: "mkThemeDarkVsCodeVisualStudioDarkCodeTheme.json",
        sourcePath: resolveDefaultThemePath("dark_vs.json"),
        targetFileName: "vsCodeVisualStudioDark.json",
    },
    {
        label: "mK Theme Dark VS Code High Contrast Code",
        outputPath: "mkThemeDarkVsCodeHighContrastCodeTheme.json",
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
        outputPath: themeImport.outputPath,
        tokenColors,
        semanticTokenColors,
    };
}

function readThemeWithIncludes(themePath: string, depth: number): UpstreamTheme {
    if (depth > 8) {
        throw new Error(`Theme include depth exceeded for ${themePath}`);
    }

    const theme = readJsonFile(themePath) as UpstreamTheme;

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

for (const themeImport of imports) {
    const targetPath = resolve(codeVariantsPath, themeImport.targetFileName);
    const codeTheme = readCodeTheme(themeImport);

    writeJsonFile(targetPath, codeTheme);
    console.log(`Wrote ${targetPath}`);
}
