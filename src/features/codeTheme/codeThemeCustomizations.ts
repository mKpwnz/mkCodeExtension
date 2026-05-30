import * as vscode from "vscode";
import type { CodeThemeVariant } from "@/features/codeTheme/codeThemeTypes";
import { mkWorkspaceThemeIds } from "@/features/theme/colorTheme";
import { logExtensionDebug } from "@/shared/extensionLogger";

type TokenColorCustomizations = Record<string, unknown>;
type SemanticTokenColorCustomizations = Record<string, unknown>;

export async function applyCodeThemeVariant(variant: CodeThemeVariant): Promise<void> {
    const configuration = vscode.workspace.getConfiguration();
    logExtensionDebug(
        "Code Theme",
        `Writing customization overrides for "${variant.label}" (${variant.id}).`,
    );

    await applyTextMateTokenCustomizations(configuration, variant);
    await applySemanticTokenCustomizations(configuration, variant);
}

async function applyTextMateTokenCustomizations(
    configuration: vscode.WorkspaceConfiguration,
    variant: CodeThemeVariant,
): Promise<void> {
    const currentCustomizations = configuration.get<TokenColorCustomizations>(
        "editor.tokenColorCustomizations",
        {},
    );
    const nextCustomizations = { ...currentCustomizations };

    for (const themeName of mkWorkspaceThemeIds) {
        const themeCustomizations = readObject(currentCustomizations[`[${themeName}]`]);
        nextCustomizations[`[${themeName}]`] = {
            ...themeCustomizations,
            textMateRules: variant.tokenColors,
        };
    }

    await updateIfChanged(
        configuration,
        "editor.tokenColorCustomizations",
        currentCustomizations,
        nextCustomizations,
    );
}

async function applySemanticTokenCustomizations(
    configuration: vscode.WorkspaceConfiguration,
    variant: CodeThemeVariant,
): Promise<void> {
    const currentCustomizations = configuration.get<SemanticTokenColorCustomizations>(
        "editor.semanticTokenColorCustomizations",
        {},
    );
    const nextCustomizations = { ...currentCustomizations };

    for (const themeName of mkWorkspaceThemeIds) {
        const themeCustomizations = readObject(currentCustomizations[`[${themeName}]`]);
        nextCustomizations[`[${themeName}]`] = {
            ...themeCustomizations,
            enabled: true,
            rules: variant.semanticTokenColors,
        };
    }

    await updateIfChanged(
        configuration,
        "editor.semanticTokenColorCustomizations",
        currentCustomizations,
        nextCustomizations,
    );
}

async function updateIfChanged(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
    currentValue: unknown,
    nextValue: unknown,
): Promise<void> {
    if (JSON.stringify(currentValue) === JSON.stringify(nextValue)) {
        return;
    }

    await configuration.update(key, nextValue, vscode.ConfigurationTarget.Global);
}

function readObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
}
