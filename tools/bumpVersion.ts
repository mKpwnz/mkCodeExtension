import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { workspaceRoot } from "./lib/paths";

type BumpKind = "patch" | "minor" | "major";

type PackageJson = {
    version?: string;
    [key: string]: JsonValue | undefined;
};

type Version = {
    major: number;
    minor: number;
    patch: number;
};

const validBumpKinds = new Set<string>(["patch", "minor", "major"]);
const packageJsonPath = resolve(workspaceRoot, "package.json");
const changelogPath = resolve(workspaceRoot, "CHANGELOG.md");

function parseVersion(version: string): Version {
    const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

    if (!versionMatch) {
        throw new Error(`Unsupported version format: ${version}`);
    }

    return {
        major: Number.parseInt(versionMatch[1] ?? "", 10),
        minor: Number.parseInt(versionMatch[2] ?? "", 10),
        patch: Number.parseInt(versionMatch[3] ?? "", 10),
    };
}

function bumpVersion(version: Version, bumpKind: BumpKind): Version {
    if (bumpKind === "major") {
        return {
            major: version.major + 1,
            minor: 0,
            patch: 0,
        };
    }

    if (bumpKind === "minor") {
        return {
            major: version.major,
            minor: version.minor + 1,
            patch: 0,
        };
    }

    return {
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
    };
}

function formatVersion(version: Version): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

function normalizeReleaseNote(note: string | undefined): string {
    const normalizedNote = note?.trim();

    if (!normalizedNote) {
        return "TODO: Document release changes before publishing.";
    }

    return normalizedNote.startsWith("- ") ? normalizedNote.slice(2).trim() : normalizedNote;
}

function updateChangelog(version: string, releaseNote: string): void {
    const changelog = readFileSync(changelogPath, "utf8");
    const versionHeading = `## ${version}`;

    if (changelog.includes(versionHeading)) {
        throw new Error(`CHANGELOG.md already contains ${versionHeading}.`);
    }

    const trimmedChangelog = changelog.trimEnd();
    const nextChangelog = trimmedChangelog.replace(
        "# Changelog",
        `# Changelog\n\n${versionHeading}\n\n- ${releaseNote}`,
    );

    writeFileSync(changelogPath, `${nextChangelog}\n`, "utf8");
}

const [bumpKindArg, ...releaseNoteParts] = process.argv.slice(2);

if (!bumpKindArg || !validBumpKinds.has(bumpKindArg)) {
    throw new Error("Usage: bun run version:bump <patch|minor|major> [release note]");
}

const bumpKind = bumpKindArg as BumpKind;
const packageJson = readJsonFile(packageJsonPath) as PackageJson;
const currentVersion = packageJson.version;

if (!currentVersion) {
    throw new Error("package.json does not contain a version.");
}

const nextVersion = formatVersion(bumpVersion(parseVersion(currentVersion), bumpKind));
const releaseNote = normalizeReleaseNote(releaseNoteParts.join(" "));

packageJson.version = nextVersion;
writeJsonFile(packageJsonPath, packageJson as JsonValue);
updateChangelog(nextVersion, releaseNote);

console.log(`Bumped version ${currentVersion} -> ${nextVersion}`);
console.log(`Updated ${packageJsonPath}`);
console.log(`Updated ${changelogPath}`);
