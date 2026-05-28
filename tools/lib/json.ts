import { readFileSync, writeFileSync } from "node:fs";
import { ensureParentDirectory } from "./paths";

export type JsonValue =
    | null
    | boolean
    | number
    | string
    | JsonValue[]
    | { [key: string]: JsonValue };

export function readJsonFile<T extends JsonValue>(path: string): T {
    const content = readFileSync(path, "utf8");
    return JSON.parse(content) as T;
}

export function writeJsonFile(path: string, value: JsonValue): void {
    ensureParentDirectory(path);
    writeFileSync(`${path}`, `${JSON.stringify(value, null, 4)}\n`, "utf8");
}
