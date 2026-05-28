import type { WorkspaceConfiguration } from "vscode";

export function readStringArray(
    configuration: WorkspaceConfiguration,
    key: string,
): readonly string[] {
    const value = configuration.get<unknown>(key);

    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(Math.max(Math.trunc(value), min), max);
}
