import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { ensureParentDirectory, workspaceRoot } from "./lib/paths";
import { readThemeWithIncludes } from "./lib/themeExtraction";

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

type CliOptions = {
    readonly source: string;
    readonly requestedThemeLabel: string | undefined;
    readonly requestedId: string | undefined;
};

type ZipEntry = {
    readonly name: string;
    readonly method: number;
    readonly compressedSize: number;
    readonly uncompressedSize: number;
    readonly localHeaderOffset: number;
};

const userVariantsPath = resolve(workspaceRoot, "assets", "themeSources", "codeVariants");
const maxZipEntries = 20000;
const maxThemeFileSize = 10 * 1024 * 1024;
const marketplaceItemPrefix = "itemName=";
const marketplacePackageUrlPrefix =
    "https://marketplace.visualstudio.com/_apis/public/gallery/publishers";

async function main(): Promise<void> {
    const options = readCliOptions(process.argv.slice(2));
    const tempDirectory = mkdtempSync(resolve(tmpdir(), "mk-code-theme-"));

    try {
        const vsixPath = await resolveVsixSource(options.source, tempDirectory);
        const extractionDirectory = resolve(tempDirectory, "extract");
        extractVsix(vsixPath, extractionDirectory);

        const manifestPath = resolve(extractionDirectory, "extension", "package.json");
        const manifest = readJsonFile(manifestPath) as ExtensionManifest;
        const theme = selectThemeContribution(manifest, options.requestedThemeLabel);
        const themePath = resolve(
            extractionDirectory,
            "extension",
            normalizeContributionPath(theme.path ?? ""),
        );
        const upstreamTheme = readThemeWithIncludes(themePath, 0);
        const tokenColors = upstreamTheme.tokenColors ?? [];
        const semanticTokenColors = upstreamTheme.semanticTokenColors ?? {};

        if (tokenColors.length === 0) {
            throw new Error(`Theme "${theme.label ?? basename(themePath)}" has no token colors.`);
        }

        const id = options.requestedId ?? createThemeId(manifest, theme);
        const label = `User Theme ${theme.label ?? manifest.displayName ?? id}`;
        const targetPath = resolve(userVariantsPath, `${id}.json`);
        const codeTheme: JsonValue = {
            label,
            tokenColors,
            semanticTokenColors,
        };

        writeJsonFile(targetPath, codeTheme);
        console.log(`Wrote ${targetPath}`);
        console.log(`Use "mK Theme: Select Code Theme" and select "${label}".`);
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function readCliOptions(args: readonly string[]): CliOptions {
    const source = args[0];

    if (!source) {
        throw new Error(
            "Usage: bun tools/importMarketplaceCodeTheme.ts <marketplace-url|publisher.extension|path.vsix> [theme label] [--id custom-id]",
        );
    }

    const idIndex = args.indexOf("--id");
    const requestedId = idIndex >= 0 ? args[idIndex + 1] : undefined;
    const requestedThemeLabel = args
        .filter((_, index) => index !== 0 && index !== idIndex && index !== idIndex + 1)
        .join(" ")
        .trim();

    return {
        source,
        requestedThemeLabel: requestedThemeLabel.length > 0 ? requestedThemeLabel : undefined,
        requestedId: requestedId ? sanitizeId(requestedId) : undefined,
    };
}

async function resolveVsixSource(source: string, tempDirectory: string): Promise<string> {
    if (source.toLowerCase().endsWith(".vsix") && existsSync(source)) {
        return resolve(source);
    }

    const extensionId = parseExtensionId(source);
    const [publisher, extensionName] = extensionId.split(".");

    if (!publisher || !extensionName) {
        throw new Error(`Invalid Marketplace extension id: ${source}`);
    }

    const url = `${marketplacePackageUrlPrefix}/${publisher}/vsextensions/${extensionName}/latest/vspackage`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download VSIX from Marketplace: ${response.status}`);
    }

    const targetPath = resolve(tempDirectory, `${publisher}.${extensionName}.vsix`);
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(targetPath, buffer);

    return targetPath;
}

function parseExtensionId(source: string): string {
    const markerIndex = source.indexOf(marketplaceItemPrefix);

    if (markerIndex >= 0) {
        return source.slice(markerIndex + marketplaceItemPrefix.length).split("&")[0] ?? "";
    }

    return source;
}

function selectThemeContribution(
    manifest: ExtensionManifest,
    requestedThemeLabel: string | undefined,
): ThemeContribution {
    const themes = manifest.contributes?.themes ?? [];
    const darkThemes = themes.filter((theme) => theme.uiTheme !== "vs");
    const candidates = darkThemes.length > 0 ? darkThemes : themes;

    if (candidates.length === 0) {
        throw new Error("Marketplace extension does not contribute any color themes.");
    }

    if (requestedThemeLabel) {
        const requestedTheme = candidates.find((theme) => theme.label === requestedThemeLabel);

        if (!requestedTheme) {
            const labels = candidates.map((theme) => theme.label ?? "<unnamed>").join(", ");
            throw new Error(
                `Theme "${requestedThemeLabel}" not found. Available themes: ${labels}`,
            );
        }

        return validateThemeContribution(requestedTheme);
    }

    const firstTheme = candidates[0];

    if (!firstTheme) {
        throw new Error("Marketplace extension does not contribute any usable color themes.");
    }

    return validateThemeContribution(firstTheme);
}

function validateThemeContribution(theme: ThemeContribution): ThemeContribution {
    if (!theme.path || theme.path.trim().length === 0) {
        throw new Error(`Theme "${theme.label ?? "<unnamed>"}" has no contribution path.`);
    }

    return theme;
}

function normalizeContributionPath(path: string): string {
    return path.replace(/^[./\\]+/, "").replaceAll("\\", "/");
}

function createThemeId(manifest: ExtensionManifest, theme: ThemeContribution): string {
    const rawId = [
        "user",
        manifest.publisher,
        manifest.name,
        theme.label ?? basename(theme.path ?? "theme", ".json"),
    ]
        .filter((part): part is string => typeof part === "string" && part.length > 0)
        .join("-");

    return sanitizeId(rawId);
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

        const content = readZipEntryContent(archive, entry);
        const targetPath = resolve(targetDirectory, entry.name);

        if (!targetPath.startsWith(targetDirectory)) {
            throw new Error(`Unsafe VSIX entry path: ${entry.name}`);
        }

        ensureParentDirectory(targetPath);
        writeFileSync(targetPath, content);
    }
}

function shouldExtractEntry(entry: ZipEntry): boolean {
    if (!entry.name.startsWith("extension/") || entry.name.endsWith("/")) {
        return false;
    }

    if (entry.uncompressedSize > maxThemeFileSize) {
        return false;
    }

    return entry.name === "extension/package.json" || entry.name.endsWith(".json");
}

function readZipEntries(archive: Buffer): readonly ZipEntry[] {
    const endOfCentralDirectoryOffset = findEndOfCentralDirectory(archive);
    const entryCount = archive.readUInt16LE(endOfCentralDirectoryOffset + 10);
    const centralDirectoryOffset = archive.readUInt32LE(endOfCentralDirectoryOffset + 16);
    const boundedEntryCount = Math.min(entryCount, maxZipEntries);
    const entries: ZipEntry[] = [];
    let offset = centralDirectoryOffset;

    for (let index = 0; index < boundedEntryCount; index += 1) {
        if (archive.readUInt32LE(offset) !== 0x02014b50) {
            throw new Error("Invalid VSIX central directory.");
        }

        const method = archive.readUInt16LE(offset + 10);
        const compressedSize = archive.readUInt32LE(offset + 20);
        const uncompressedSize = archive.readUInt32LE(offset + 24);
        const fileNameLength = archive.readUInt16LE(offset + 28);
        const extraLength = archive.readUInt16LE(offset + 30);
        const commentLength = archive.readUInt16LE(offset + 32);
        const localHeaderOffset = archive.readUInt32LE(offset + 42);
        const nameStart = offset + 46;
        const name = archive.toString("utf8", nameStart, nameStart + fileNameLength);

        entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset });
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
        const content = inflateRawSync(compressedContent);

        if (content.length !== entry.uncompressedSize) {
            throw new Error(`Invalid uncompressed size for ${entry.name}`);
        }

        return content;
    }

    throw new Error(`Unsupported ZIP compression method ${entry.method} for ${entry.name}`);
}

void main();
