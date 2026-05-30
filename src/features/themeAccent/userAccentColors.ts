import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type * as vscode from "vscode";
import { normalizeHexColor } from "@/shared/color";

export type UserAccentColor = {
    readonly id: string;
    readonly label: string;
    readonly color: string;
};

type RawUserAccentColor = {
    readonly label?: unknown;
    readonly color?: unknown;
};

const userAccentColorDirectoryName = "highlightColors";
const colorFileExtension = ".json";
const maxUserAccentColorCount = 64;

export function getUserAccentColorsDirectory(context: vscode.ExtensionContext): string {
    return join(context.globalStorageUri.fsPath, userAccentColorDirectoryName);
}

export function readUserAccentColors(context: vscode.ExtensionContext): readonly UserAccentColor[] {
    return readUserAccentColorsFromDirectory(getUserAccentColorsDirectory(context));
}

export function saveUserAccentColor(
    userColorsDirectory: string,
    label: string,
    color: string,
    existingColorId = "",
): UserAccentColor {
    const sanitizedLabel = sanitizeLabel(label);
    const normalizedColor = normalizeHexColor(color, "#a1fb1a");
    const id = createColorId(sanitizedLabel, normalizedColor);
    const targetPath = resolve(userColorsDirectory, `${id}${colorFileExtension}`);

    mkdirSync(userColorsDirectory, { recursive: true });

    if (!targetPath.startsWith(resolve(userColorsDirectory))) {
        throw new Error("Refusing to save highlight color outside the user color directory.");
    }

    if (existingColorId.length > 0 && existingColorId !== id) {
        deleteUserAccentColorFile(userColorsDirectory, existingColorId);
    }

    deleteUserAccentColorByLabel(userColorsDirectory, sanitizedLabel, existingColorId);

    writeFileSync(
        targetPath,
        `${JSON.stringify({ label: sanitizedLabel, color: normalizedColor }, null, 4)}\n`,
        "utf8",
    );

    return {
        id,
        label: sanitizedLabel,
        color: normalizedColor,
    };
}

export function renameUserAccentColorFile(
    userColorsDirectory: string,
    colorId: string,
    nextLabel: string,
): UserAccentColor | undefined {
    const existingColor = readUserAccentColor(
        userColorsDirectory,
        `${colorId}${colorFileExtension}`,
    );

    if (!existingColor) {
        return undefined;
    }

    deleteUserAccentColorFile(userColorsDirectory, colorId);
    return saveUserAccentColor(userColorsDirectory, nextLabel, existingColor.color);
}

export function deleteUserAccentColorFile(userColorsDirectory: string, colorId: string): void {
    const targetPath = resolve(userColorsDirectory, `${colorId}${colorFileExtension}`);

    if (!targetPath.startsWith(resolve(userColorsDirectory)) || !existsSync(targetPath)) {
        return;
    }

    rmSync(targetPath, { force: true });
}

function deleteUserAccentColorByLabel(
    userColorsDirectory: string,
    label: string,
    ignoredColorId: string,
): void {
    const normalizedLabel = label.trim().toLocaleLowerCase();
    const colors = readUserAccentColorsFromDirectory(userColorsDirectory);

    for (const color of colors) {
        if (
            color.id !== ignoredColorId &&
            color.label.trim().toLocaleLowerCase() === normalizedLabel
        ) {
            deleteUserAccentColorFile(userColorsDirectory, color.id);
        }
    }
}

function readUserAccentColorsFromDirectory(
    userColorsDirectory: string,
): readonly UserAccentColor[] {
    if (!existsSync(userColorsDirectory)) {
        return [];
    }

    const fileNames = readdirUserAccentColorFiles(userColorsDirectory);

    return fileNames
        .map((fileName) => readUserAccentColor(userColorsDirectory, fileName))
        .filter((color): color is UserAccentColor => Boolean(color));
}

function readdirUserAccentColorFiles(userColorsDirectory: string): readonly string[] {
    return readdirSync(userColorsDirectory)
        .filter((fileName) => fileName.endsWith(colorFileExtension))
        .sort((left, right) => left.localeCompare(right))
        .slice(0, maxUserAccentColorCount);
}

function readUserAccentColor(
    userColorsDirectory: string,
    fileName: string,
): UserAccentColor | undefined {
    const filePath = resolve(userColorsDirectory, fileName);

    if (!filePath.startsWith(resolve(userColorsDirectory))) {
        return undefined;
    }

    const rawContent = readFileSync(filePath, "utf8");
    const rawColor = JSON.parse(rawContent) as RawUserAccentColor;

    if (typeof rawColor.color !== "string") {
        return undefined;
    }

    const normalizedColor = normalizeHexColor(rawColor.color, "");

    if (normalizedColor.length === 0) {
        return undefined;
    }

    return {
        id: basename(fileName, colorFileExtension),
        label: readLabel(rawColor, fileName),
        color: normalizedColor,
    };
}

function readLabel(rawColor: RawUserAccentColor, fileName: string): string {
    if (typeof rawColor.label === "string" && rawColor.label.trim().length > 0) {
        return sanitizeLabel(rawColor.label);
    }

    return basename(fileName, colorFileExtension);
}

function sanitizeLabel(label: string): string {
    const trimmedLabel = label.trim().slice(0, 80);

    if (trimmedLabel.length === 0) {
        return "Custom Highlight";
    }

    return trimmedLabel;
}

function createColorId(label: string, color: string): string {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
    const normalizedSlug = slug.length > 0 ? slug : "custom-highlight";

    return `${normalizedSlug}-${color.replace("#", "")}`;
}
