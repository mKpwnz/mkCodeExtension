import * as vscode from "vscode";
import { buildAccentColors } from "@/features/themeAccent/accentColors";
import {
    accentColorKey,
    accentPresetKey,
    accentSettingSection,
    resolveAccentColor,
} from "@/features/themeAccent/accentPresets";
import { defaultHighlightColor } from "@/shared/color";

const themeName = "mK Theme Dark";

export async function applyConfiguredAccentColor(): Promise<void> {
    const accentColor = getConfiguredAccentColor();
    const configuration = vscode.workspace.getConfiguration();
    const currentCustomizations = configuration.get<Record<string, unknown>>(
        "workbench.colorCustomizations",
        {},
    );
    const themeCustomizations = getThemeCustomizations(currentCustomizations);
    const nextThemeCustomizations = {
        ...themeCustomizations,
        ...buildAccentColors(accentColor),
    };
    const nextCustomizations = {
        ...currentCustomizations,
        [`[${themeName}]`]: nextThemeCustomizations,
    };

    if (JSON.stringify(currentCustomizations) === JSON.stringify(nextCustomizations)) {
        return;
    }

    await configuration.update(
        "workbench.colorCustomizations",
        nextCustomizations,
        vscode.ConfigurationTarget.Global,
    );
}

function getConfiguredAccentColor(): string {
    const configuration = vscode.workspace.getConfiguration(accentSettingSection);
    const preset = configuration.get<string>(accentPresetKey, "lime");
    const customColor = configuration.get<string>(accentColorKey, defaultHighlightColor);

    return resolveAccentColor(preset, customColor);
}

function getThemeCustomizations(customizations: Record<string, unknown>): Record<string, string> {
    const themeValue = customizations[`[${themeName}]`];

    if (!themeValue || typeof themeValue !== "object" || Array.isArray(themeValue)) {
        return {};
    }

    return themeValue as Record<string, string>;
}
