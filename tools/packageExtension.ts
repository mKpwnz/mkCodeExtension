import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { readJsonFile } from "./lib/json";
import { workspaceRoot } from "./lib/paths";

type PackageManifest = {
    name: string;
    version: string;
};

const manifest = readJsonFile(resolve(workspaceRoot, "package.json")) as unknown as PackageManifest;
const buildDirectory = resolve(workspaceRoot, "build");
const outputPath = resolve(buildDirectory, `${manifest.name}-${manifest.version}.vsix`);

mkdirSync(buildDirectory, { recursive: true });

execFileSync("bunx", ["@vscode/vsce", "package", "--out", outputPath], {
    cwd: workspaceRoot,
    shell: process.platform === "win32",
    stdio: "inherit",
});
