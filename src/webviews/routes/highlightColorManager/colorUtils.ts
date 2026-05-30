import type { SystemAccentColor, UserAccentColor } from "@/types";
import type { SelectedColor } from "./types";

export const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

export function createSelectedColor(
    color: string,
    systemColors: readonly SystemAccentColor[],
    userColors: readonly UserAccentColor[],
): SelectedColor {
    const normalizedColor = normalizeColor(color);
    const systemColor = systemColors.find((candidate) => candidate.color === normalizedColor);

    if (systemColor) {
        return systemColorToSelection(systemColor);
    }

    const userColor = userColors.find((candidate) => candidate.color === normalizedColor);

    if (userColor) {
        return userColorToSelection(userColor);
    }

    return {
        color: normalizedColor,
        id: "",
        label: createDefaultUserColorName(userColors),
        source: "custom",
    };
}

export function createDefaultUserColorName(userColors: readonly UserAccentColor[]): string {
    return `Custom Color ${userColors.length + 1}`;
}

export function hexToRgb(value: string): readonly [number, number, number] {
    if (!hexColorPattern.test(value)) {
        return [0, 0, 0];
    }

    return [
        Number.parseInt(value.slice(1, 3), 16),
        Number.parseInt(value.slice(3, 5), 16),
        Number.parseInt(value.slice(5, 7), 16),
    ];
}

export function normalizeColor(value: string): string {
    return value.trim().toLowerCase();
}

export function readUserColors(value: readonly unknown[]): readonly UserAccentColor[] {
    return value.filter(isUserAccentColor);
}

export function systemColorToSelection(color: SystemAccentColor): SelectedColor {
    return {
        color: color.color,
        id: color.id,
        label: color.label,
        source: "system",
    };
}

export function userColorToSelection(color: UserAccentColor): SelectedColor {
    return {
        color: color.color,
        id: color.id,
        label: color.label,
        source: "user",
    };
}

function isUserAccentColor(value: unknown): value is UserAccentColor {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const candidate = value as {
        readonly id?: unknown;
        readonly label?: unknown;
        readonly color?: unknown;
    };

    return (
        typeof candidate.id === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.color === "string" &&
        hexColorPattern.test(candidate.color)
    );
}
