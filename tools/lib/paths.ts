import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const workspaceRoot = resolve(process.cwd());
export const upstreamRoot = resolve(workspaceRoot, ".cache", "upstreams");

export function ensureParentDirectory(filePath: string): void {
    const directoryPath = dirname(filePath);

    if (!existsSync(directoryPath)) {
        mkdirSync(directoryPath, { recursive: true });
    }
}

export function assertPathExists(path: string, label: string): void {
    if (!existsSync(path)) {
        throw new Error(`${label} does not exist: ${path}`);
    }
}
