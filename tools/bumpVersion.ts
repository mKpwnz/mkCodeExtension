import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
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
const readmePath = resolve(workspaceRoot, "README.md");
const upcomingChangesPath = resolve(workspaceRoot, "upcomingChanges.md");
const versionFilePaths = [packageJsonPath, changelogPath, readmePath, upcomingChangesPath];
const versionReferenceFilePaths = [packageJsonPath, readmePath];

function toGitRelativePath(filePath: string): string {
    return relative(workspaceRoot, filePath).replaceAll("\\", "/");
}

function git(args: string[], stdio: "ignore" | "inherit" | "pipe" = "inherit"): string {
    const output = execFileSync("git", args, {
        cwd: workspaceRoot,
        encoding: "utf8",
        stdio,
    });

    return typeof output === "string" ? output.trim() : "";
}

function gh(args: string[], stdio: "ignore" | "inherit" | "pipe" = "inherit"): string {
    const output = execFileSync("gh", args, {
        cwd: workspaceRoot,
        encoding: "utf8",
        stdio,
    });

    return typeof output === "string" ? output.trim() : "";
}

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

function ensureWorkingTreeIsClean(): void {
    const status = git(["status", "--porcelain"], "pipe");

    if (status) {
        throw new Error("Working tree must be clean before bumping the version.");
    }
}

function ensureGitHubCliIsAvailable(): void {
    try {
        gh(["--version"], "ignore");
    } catch {
        throw new Error(
            "GitHub CLI `gh` must be installed and available in PATH before bumping the version.",
        );
    }
}

function ensureGitHubCliIsAuthenticated(): void {
    try {
        gh(["auth", "status"], "ignore");
    } catch {
        throw new Error("GitHub CLI `gh` must be authenticated before bumping the version.");
    }
}

function ensureGitHubRepositoryIsReachable(): void {
    try {
        gh(["repo", "view"], "ignore");
    } catch {
        throw new Error("GitHub CLI `gh` must be able to access this repository.");
    }
}

function ensureUpcomingChangesFileExists(): void {
    if (!existsSync(upcomingChangesPath)) {
        writeFileSync(
            upcomingChangesPath,
            "# Upcoming Changes\n\n- TODO: Document release changes before publishing.\n",
            "utf8",
        );
    }
}

function readUpcomingChanges(): string {
    ensureUpcomingChangesFileExists();

    const upcomingChanges = readFileSync(upcomingChangesPath, "utf8")
        .replace(/^# Upcoming Changes\s*/u, "")
        .trim();

    if (!upcomingChanges) {
        throw new Error("upcomingChanges.md must contain release notes before bumping.");
    }

    return upcomingChanges;
}

function updateChangelog(version: string, releaseNotes: string): void {
    const changelog = readFileSync(changelogPath, "utf8");
    const versionHeading = `## ${version}`;

    if (changelog.includes(versionHeading)) {
        throw new Error(`CHANGELOG.md already contains ${versionHeading}.`);
    }

    const trimmedChangelog = changelog.trimEnd();
    const nextChangelog = trimmedChangelog.replace(
        "# Changelog",
        `# Changelog\n\n${versionHeading}\n\n${releaseNotes}`,
    );

    writeFileSync(changelogPath, `${nextChangelog}\n`, "utf8");
}

function clearUpcomingChanges(): void {
    writeFileSync(upcomingChangesPath, "# Upcoming Changes\n\n", "utf8");
}

function updateVersionReferences(currentVersion: string, nextVersion: string): void {
    for (const filePath of versionReferenceFilePaths) {
        if (!existsSync(filePath)) {
            continue;
        }

        const content = readFileSync(filePath, "utf8");
        const nextContent = content.replaceAll(currentVersion, nextVersion);

        if (nextContent !== content) {
            writeFileSync(filePath, nextContent, "utf8");
        }
    }
}

function fetchOriginMain(): void {
    git(["fetch", "origin", "main", "--tags"]);
}

function checkoutOriginMain(): void {
    git(["checkout", "--detach", "origin/main"]);
}

function createReleaseBranch(branchName: string): void {
    git(["checkout", "-B", branchName, "origin/main"]);
}

function ensureOnlyVersionFilesChanged(): void {
    const changedFiles = git(["diff", "--name-only", "--cached"], "pipe")
        .split("\n")
        .filter(Boolean);
    const allowedFiles = new Set(versionFilePaths.map((filePath) => toGitRelativePath(filePath)));
    const disallowedFiles = changedFiles.filter((filePath) => !allowedFiles.has(filePath));

    if (disallowedFiles.length > 0) {
        throw new Error(`Version commit contains disallowed files: ${disallowedFiles.join(", ")}`);
    }
}

function createVersionCommitAndTag(version: string): string {
    const tagName = `v${version}`;

    git(["add", ...versionFilePaths]);
    ensureOnlyVersionFilesChanged();
    git(["commit", "--no-verify", "-m", `chore: bump version to ${tagName}`]);
    git(["tag", tagName]);

    return tagName;
}

function pushReleaseBranchAndTag(branchName: string, tagName: string): void {
    git(["push", "-u", "origin", branchName]);
    git(["push", "origin", tagName]);
}

function createPullRequest(version: string, branchName: string, releaseNotes: string): string {
    const title = `chore: release v${version}`;
    const body = `## Release\n\n${releaseNotes}`;

    return gh(
        ["pr", "create", "--base", "main", "--head", branchName, "--title", title, "--body", body],
        "pipe",
    );
}

function checkoutAndUpdateMain(): void {
    git(["fetch", "origin", "main"]);
    git(["checkout", "main"]);
    git(["pull", "--ff-only", "origin", "main"]);
}

const [bumpKindArg] = process.argv.slice(2);

if (!bumpKindArg || !validBumpKinds.has(bumpKindArg)) {
    throw new Error("Usage: bun run version:bump <patch|minor|major>");
}

const bumpKind = bumpKindArg as BumpKind;

ensureWorkingTreeIsClean();
git(["rev-parse", "--is-inside-work-tree"], "ignore");
ensureGitHubCliIsAvailable();
ensureGitHubCliIsAuthenticated();
ensureGitHubRepositoryIsReachable();
fetchOriginMain();
checkoutOriginMain();

const packageJson = readJsonFile(packageJsonPath) as PackageJson;
const currentVersion = packageJson.version;

if (!currentVersion) {
    throw new Error("package.json does not contain a version.");
}

const nextVersion = formatVersion(bumpVersion(parseVersion(currentVersion), bumpKind));
const branchName = `versionupdate/v${nextVersion}`;
const releaseNotes = readUpcomingChanges();

createReleaseBranch(branchName);

const releasePackageJson = readJsonFile(packageJsonPath) as PackageJson;
releasePackageJson.version = nextVersion;
writeJsonFile(packageJsonPath, releasePackageJson as JsonValue);
updateVersionReferences(currentVersion, nextVersion);
updateChangelog(nextVersion, releaseNotes);
clearUpcomingChanges();
const tagName = createVersionCommitAndTag(nextVersion);
pushReleaseBranchAndTag(branchName, tagName);
const pullRequestUrl = createPullRequest(nextVersion, branchName, releaseNotes);
checkoutAndUpdateMain();

console.log(`Bumped version ${currentVersion} -> ${nextVersion}`);
console.log(`Created branch ${branchName}`);
console.log(`Committed version bump`);
console.log(`Created git tag ${tagName}`);
console.log(`Pushed ${branchName} and ${tagName}`);
console.log(`Created pull request ${pullRequestUrl}`);
console.log("Checked out and updated main");
