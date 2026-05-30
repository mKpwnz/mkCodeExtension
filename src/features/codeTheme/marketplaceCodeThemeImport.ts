import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import * as vscode from "vscode";
import type { TextMateRule } from "@/features/codeTheme/codeThemeTypes";
import { logExtensionError, logExtensionInfo, showExtensionOutput } from "@/shared/extensionLogger";
import { parseJsonWithComments } from "@/shared/jsonc";

type ExtensionManifest = {
    readonly contributes?: {
        readonly themes?: readonly ThemeContribution[];
    };
    readonly displayName?: string;
    readonly name?: string;
    readonly publisher?: string;
};

type ThemeContribution = {
    readonly label?: string;
    readonly path?: string;
    readonly uiTheme?: string;
};

type ThemeContributionQuickPickItem = vscode.QuickPickItem & {
    readonly theme: ThemeContribution;
};

type UpstreamTheme = {
    readonly include?: string;
    readonly tokenColors?: readonly TextMateRule[];
    readonly semanticTokenColors?: Record<string, unknown>;
};

type ZipEntry = {
    readonly name: string;
    readonly method: number;
    readonly compressedSize: number;
    readonly uncompressedSize: number;
    readonly localHeaderOffset: number;
};

const marketplaceItemPrefix = "itemName=";
const marketplacePackageUrlPrefix =
    "https://marketplace.visualstudio.com/_apis/public/gallery/publishers";
const maxZipEntries = 20000;
const maxJsonFileSize = 10 * 1024 * 1024;

export async function importCodeThemeFromMarketplace(
    userVariantsDirectory: string,
): Promise<readonly string[]> {
    const source = await vscode.window.showInputBox({
        title: "Import Code Theme from Marketplace",
        prompt: "Marketplace URL, publisher.extension id, or local .vsix path",
        ignoreFocusOut: true,
    });

    if (!source || source.trim().length === 0) {
        logExtensionInfo("Code Theme Import", "Import cancelled before source input.");
        return [];
    }

    try {
        logExtensionInfo("Code Theme Import", `Import requested for source: ${source.trim()}`);
        return await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Importing mK code theme",
                cancellable: false,
            },
            async () => importCodeTheme(source.trim(), userVariantsDirectory),
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error && error.stack ? `\n${error.stack}` : "";

        logExtensionError("Code Theme Import", `${message}${stack}`);

        const action = await vscode.window.showErrorMessage(
            `Failed to import code theme: ${message}`,
            "Show Output",
        );

        if (action === "Show Output") {
            showExtensionOutput();
        }

        return [];
    }
}

async function importCodeTheme(
    source: string,
    userVariantsDirectory: string,
): Promise<readonly string[]> {
    const tempDirectory = mkdtempSync(resolve(tmpdir(), "mk-code-theme-"));

    try {
        logExtensionInfo("Code Theme Import", "Resolving VSIX source.");
        const vsixPath = await resolveVsixSource(source, tempDirectory);
        logExtensionInfo("Code Theme Import", `Resolved VSIX: ${vsixPath}`);
        const extractionDirectory = resolve(tempDirectory, "extract");
        logExtensionInfo("Code Theme Import", "Extracting VSIX theme files.");
        extractVsix(vsixPath, extractionDirectory);

        const manifestPath = resolve(extractionDirectory, "extension", "package.json");
        const manifest = parseJsonWithComments<ExtensionManifest>(
            readFileSync(manifestPath, "utf8"),
        );
        logExtensionInfo(
            "Code Theme Import",
            `Loaded extension manifest "${manifest.displayName ?? manifest.name ?? "unknown"}".`,
        );
        const themes = await selectThemeContributions(manifest);
        logExtensionInfo("Code Theme Import", `Selected ${themes.length} theme contribution(s).`);
        const importedThemeIds: string[] = [];
        mkdirSync(userVariantsDirectory, { recursive: true });

        for (const theme of themes) {
            importedThemeIds.push(
                importThemeContribution(
                    theme,
                    manifest,
                    extractionDirectory,
                    userVariantsDirectory,
                ),
            );
        }

        void vscode.window.showInformationMessage(
            `Imported ${importedThemeIds.length} code theme(s).`,
        );
        logExtensionInfo(
            "Code Theme Import",
            `Import completed with theme id(s): ${importedThemeIds.join(", ")}`,
        );
        return importedThemeIds;
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

async function resolveVsixSource(source: string, tempDirectory: string): Promise<string> {
    if (source.toLowerCase().endsWith(".vsix") && existsSync(source)) {
        logExtensionInfo("Code Theme Import", `Using local VSIX path: ${source}`);
        return resolve(source);
    }

    const extensionId = parseExtensionId(source);
    const [publisher, extensionName] = extensionId.split(".");

    if (!publisher || !extensionName) {
        throw new Error(`Invalid Marketplace extension id: ${source}`);
    }

    const url = `${marketplacePackageUrlPrefix}/${publisher}/vsextensions/${extensionName}/latest/vspackage`;
    logExtensionInfo(
        "Code Theme Import",
        `Downloading VSIX from Marketplace: ${publisher}.${extensionName}`,
    );
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download VSIX from Marketplace: ${response.status}`);
    }

    const targetPath = resolve(tempDirectory, `${publisher}.${extensionName}.vsix`);
    writeFileSync(targetPath, Buffer.from(await response.arrayBuffer()));
    logExtensionInfo("Code Theme Import", `Downloaded VSIX to temporary path: ${targetPath}`);

    return targetPath;
}

function parseExtensionId(source: string): string {
    const markerIndex = source.indexOf(marketplaceItemPrefix);

    if (markerIndex >= 0) {
        return source.slice(markerIndex + marketplaceItemPrefix.length).split("&")[0] ?? "";
    }

    return source;
}

async function selectThemeContributions(
    manifest: ExtensionManifest,
): Promise<readonly ThemeContribution[]> {
    const themes = manifest.contributes?.themes ?? [];
    const candidates = themes.map((theme) => validateThemeContribution(theme));

    if (candidates.length === 0) {
        throw new Error("Marketplace extension does not contribute any color themes.");
    }

    if (candidates.length === 1) {
        logExtensionInfo(
            "Code Theme Import",
            `Only one theme contribution found: ${candidates[0]?.label ?? "<unnamed>"}.`,
        );
        return candidates;
    }

    const selected = await vscode.window.showQuickPick(
        candidates.map((theme) => createThemeContributionQuickPickItem(theme)),
        {
            title: "Select Marketplace Themes",
            placeHolder: "Choose one or more source themes to import",
            ignoreFocusOut: true,
            canPickMany: true,
        },
    );

    if (!selected || selected.length === 0) {
        logExtensionInfo("Code Theme Import", "Theme selection cancelled.");
        throw new Error("Theme import cancelled.");
    }

    return selected.map((item) => item.theme);
}

function createThemeContributionQuickPickItem(
    theme: ThemeContribution,
): ThemeContributionQuickPickItem {
    const item: ThemeContributionQuickPickItem = {
        label: theme.label ?? "<unnamed>",
        picked: theme.uiTheme !== "vs",
        theme,
    };

    if (theme.uiTheme) {
        item.description = theme.uiTheme;
    }

    return item;
}

function validateThemeContribution(theme: ThemeContribution | undefined): ThemeContribution {
    if (!theme?.path || theme.path.trim().length === 0) {
        throw new Error(`Theme "${theme?.label ?? "<unnamed>"}" has no contribution path.`);
    }

    return theme;
}

function importThemeContribution(
    theme: ThemeContribution,
    manifest: ExtensionManifest,
    extractionDirectory: string,
    userVariantsDirectory: string,
): string {
    const themePath = resolve(
        extractionDirectory,
        "extension",
        normalizeContributionPath(theme.path),
    );
    const upstreamTheme = readThemeWithIncludes(themePath, 0);
    const tokenColors = upstreamTheme.tokenColors ?? [];
    const semanticTokenColors = upstreamTheme.semanticTokenColors ?? {};

    if (tokenColors.length === 0) {
        throw new Error(`Theme "${theme.label ?? basename(themePath)}" has no token colors.`);
    }

    const id = createThemeId(manifest, theme);
    const label = `User Theme ${theme.label ?? manifest.displayName ?? id}`;
    const targetPath = resolve(userVariantsDirectory, `${id}.json`);

    writeFileSync(
        targetPath,
        `${JSON.stringify({ label, tokenColors, semanticTokenColors }, null, 4)}\n`,
        "utf8",
    );
    logExtensionInfo(
        "Code Theme Import",
        `Stored "${label}" at ${targetPath} with ${tokenColors.length} TextMate rule(s).`,
    );

    return id;
}

function readThemeWithIncludes(themePath: string, depth: number): UpstreamTheme {
    if (depth > 8) {
        throw new Error(`Theme include depth exceeded for ${themePath}`);
    }

    const theme = parseJsonWithComments<UpstreamTheme>(readFileSync(themePath, "utf8"));

    if (!theme.include) {
        return theme;
    }

    const includedPath = resolve(themePath, "..", theme.include);
    const includedTheme = readThemeWithIncludes(includedPath, depth + 1);

    return {
        tokenColors: [...(includedTheme.tokenColors ?? []), ...(theme.tokenColors ?? [])],
        semanticTokenColors: {
            ...(includedTheme.semanticTokenColors ?? {}),
            ...(theme.semanticTokenColors ?? {}),
        },
    };
}

function normalizeContributionPath(path: string | undefined): string {
    return (path ?? "").replace(/^[./\\]+/, "").replaceAll("\\", "/");
}

function createThemeId(manifest: ExtensionManifest, theme: ThemeContribution): string {
    return sanitizeId(
        ["user", manifest.publisher, manifest.name, theme.label ?? basename(theme.path ?? "theme")]
            .filter((part): part is string => typeof part === "string" && part.length > 0)
            .join("-"),
    );
}

function sanitizeId(value: string): string {
    const sanitized = value
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    if (sanitized.length === 0) {
        throw new Error("Theme id must contain at least one letter or digit.");
    }

    return sanitized.slice(0, 100);
}

function extractVsix(vsixPath: string, targetDirectory: string): void {
    const archive = readFileSync(vsixPath);
    const entries = readZipEntries(archive);

    for (const entry of entries) {
        if (!shouldExtractEntry(entry)) {
            continue;
        }

        const targetPath = resolve(targetDirectory, entry.name);

        if (!targetPath.startsWith(targetDirectory)) {
            throw new Error(`Unsafe VSIX entry path: ${entry.name}`);
        }

        mkdirSync(resolve(targetPath, ".."), { recursive: true });
        writeFileSync(targetPath, readZipEntryContent(archive, entry));
    }
}

function shouldExtractEntry(entry: ZipEntry): boolean {
    if (!entry.name.startsWith("extension/") || entry.name.endsWith("/")) {
        return false;
    }

    return entry.uncompressedSize <= maxJsonFileSize && entry.name.endsWith(".json");
}

function readZipEntries(archive: Buffer): readonly ZipEntry[] {
    const endOffset = findEndOfCentralDirectory(archive);
    const entryCount = Math.min(archive.readUInt16LE(endOffset + 10), maxZipEntries);
    let offset = archive.readUInt32LE(endOffset + 16);
    const entries: ZipEntry[] = [];

    for (let index = 0; index < entryCount; index += 1) {
        if (archive.readUInt32LE(offset) !== 0x02014b50) {
            throw new Error("Invalid VSIX central directory.");
        }

        const fileNameLength = archive.readUInt16LE(offset + 28);
        const extraLength = archive.readUInt16LE(offset + 30);
        const commentLength = archive.readUInt16LE(offset + 32);
        const nameStart = offset + 46;

        entries.push({
            method: archive.readUInt16LE(offset + 10),
            compressedSize: archive.readUInt32LE(offset + 20),
            uncompressedSize: archive.readUInt32LE(offset + 24),
            localHeaderOffset: archive.readUInt32LE(offset + 42),
            name: archive.toString("utf8", nameStart, nameStart + fileNameLength),
        });
        offset = nameStart + fileNameLength + extraLength + commentLength;
    }

    return entries;
}

function findEndOfCentralDirectory(archive: Buffer): number {
    const minimumOffset = Math.max(0, archive.length - 65557);

    for (let offset = archive.length - 22; offset >= minimumOffset; offset -= 1) {
        if (archive.readUInt32LE(offset) === 0x06054b50) {
            return offset;
        }
    }

    throw new Error("Invalid VSIX archive.");
}

function readZipEntryContent(archive: Buffer, entry: ZipEntry): Buffer {
    const offset = entry.localHeaderOffset;

    if (archive.readUInt32LE(offset) !== 0x04034b50) {
        throw new Error(`Invalid VSIX local file header: ${entry.name}`);
    }

    const fileNameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    const contentStart = offset + 30 + fileNameLength + extraLength;
    const compressedContent = archive.subarray(contentStart, contentStart + entry.compressedSize);

    if (entry.method === 0) {
        return compressedContent;
    }

    if (entry.method === 8) {
        return inflateRawSync(compressedContent);
    }

    throw new Error(`Unsupported ZIP compression method ${entry.method} for ${entry.name}`);
}
