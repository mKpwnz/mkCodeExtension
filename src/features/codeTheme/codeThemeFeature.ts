import * as vscode from "vscode";
import {
    codeThemeSettingSection,
    defaultCodeThemeId,
    readConfiguredCodeThemeId,
    updateConfiguredCodeThemeId,
} from "@/features/codeTheme/codeThemeConfiguration";
import { applyCodeThemeVariant } from "@/features/codeTheme/codeThemeCustomizations";
import type { CodeThemeVariant } from "@/features/codeTheme/codeThemeTypes";
import {
    getUserCodeThemeVariantsDirectory,
    readCodeThemeVariants,
} from "@/features/codeTheme/codeThemeVariants";
import { importCodeThemeFromMarketplace } from "@/features/codeTheme/marketplaceCodeThemeImport";
import { deleteUserCodeThemes } from "@/features/codeTheme/userCodeThemeDelete";
import { logExtensionDebug, logExtensionInfo } from "@/shared/extensionLogger";

const selectCodeThemeCommand = "mkTheme.selectCodeTheme";
const importCodeThemeCommand = "mkTheme.importCodeThemeFromMarketplace";
const deleteUserCodeThemesCommand = "mkTheme.deleteUserCodeThemes";
const previewDebounceMilliseconds = 40;

type CodeThemeQuickPickItem = vscode.QuickPickItem & {
    readonly variant: CodeThemeVariant;
};

export function activateCodeTheme(context: vscode.ExtensionContext): void {
    let variants = readCodeThemeVariants(context);
    logExtensionInfo("Code Theme", `Loaded ${variants.length} code theme variant(s).`);

    context.subscriptions.push(
        vscode.commands.registerCommand(selectCodeThemeCommand, () => selectCodeTheme(variants)),
        vscode.commands.registerCommand(importCodeThemeCommand, async () => {
            logExtensionInfo("Code Theme", "Import command started.");
            const importedThemeIds = await importCodeThemeFromMarketplace(
                getUserCodeThemeVariantsDirectory(context),
            );

            if (importedThemeIds.length === 0) {
                logExtensionInfo("Code Theme", "Import command finished without imported themes.");
                return;
            }

            variants = readCodeThemeVariants(context);
            logExtensionInfo(
                "Code Theme",
                `Imported ${importedThemeIds.length} theme(s); reloaded ${variants.length} variant(s).`,
            );
            await updateConfiguredCodeThemeId(importedThemeIds[0] ?? defaultCodeThemeId);
            await applyConfiguredCodeTheme(variants);
        }),
        vscode.commands.registerCommand(deleteUserCodeThemesCommand, async () => {
            logExtensionInfo("Code Theme", "Delete user themes command started.");
            const deleted = await deleteUserCodeThemes(
                getUserCodeThemeVariantsDirectory(context),
                variants,
            );

            if (!deleted) {
                logExtensionInfo(
                    "Code Theme",
                    "Delete user themes command finished without changes.",
                );
                return;
            }

            variants = readCodeThemeVariants(context);
            logExtensionInfo(
                "Code Theme",
                `Reloaded ${variants.length} variant(s) after deletion.`,
            );
            await applyConfiguredCodeTheme(variants);
        }),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(codeThemeSettingSection)) {
                void applyConfiguredCodeTheme(variants);
            }
        }),
    );

    void applyConfiguredCodeTheme(variants);
}

async function selectCodeTheme(variants: readonly CodeThemeVariant[]): Promise<void> {
    logExtensionInfo("Code Theme", "Select code theme command started.");
    const configuredThemeId = readConfiguredCodeThemeId();
    const currentVariant =
        findVariant(variants, configuredThemeId) ?? findVariant(variants, defaultCodeThemeId);

    if (!currentVariant) {
        logExtensionInfo(
            "Code Theme",
            "Select command aborted because no variants were available.",
        );
        void vscode.window.showWarningMessage("No mK code theme variants were found.");
        return;
    }

    const quickPick = vscode.window.createQuickPick<CodeThemeQuickPickItem>();
    const previewState: CodeThemePreviewState = {
        accepted: false,
        currentPreviewId: currentVariant.id,
        pendingPreviewId: currentVariant.id,
        timer: undefined,
    };

    quickPick.title = "Select mK Code Theme";
    quickPick.placeholder = "Choose the code colors for mK workspace themes";
    quickPick.items = createQuickPickItems(variants, configuredThemeId);
    quickPick.activeItems = quickPick.items.filter((item) => item.variant.id === currentVariant.id);
    quickPick.onDidChangeActive((items) => schedulePreview(items[0]?.variant, previewState));
    quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0];

        if (!selected || selected.variant.id.length === 0) {
            return;
        }

        previewState.accepted = true;
        logExtensionInfo("Code Theme", `Selected code theme "${selected.variant.label}".`);
        void updateConfiguredCodeThemeId(selected.variant.id).then(() =>
            applyCodeThemeVariant(selected.variant),
        );
        quickPick.hide();
    });
    quickPick.onDidHide(() => {
        clearPreviewTimer(previewState);
        quickPick.dispose();

        if (!previewState.accepted) {
            logExtensionInfo(
                "Code Theme",
                `Selection cancelled; restored "${currentVariant.label}".`,
            );
            void applyCodeThemeVariant(currentVariant);
        }
    });
    quickPick.show();
}

async function applyConfiguredCodeTheme(variants: readonly CodeThemeVariant[]): Promise<void> {
    const configuredThemeId = readConfiguredCodeThemeId();
    const variant =
        findVariant(variants, configuredThemeId) ?? findVariant(variants, defaultCodeThemeId);

    if (!variant) {
        logExtensionInfo(
            "Code Theme",
            "Apply skipped because no configured variant was available.",
        );
        void vscode.window.showWarningMessage("No mK code theme variants were found.");
        return;
    }

    logExtensionInfo("Code Theme", `Applying configured code theme "${variant.label}".`);
    await applyCodeThemeVariant(variant);
}

function findVariant(
    variants: readonly CodeThemeVariant[],
    themeId: string,
): CodeThemeVariant | undefined {
    return variants.find((variant) => variant.id === themeId);
}

function createQuickPickItem(
    variant: CodeThemeVariant,
    configuredThemeId: string,
): CodeThemeQuickPickItem {
    const item: CodeThemeQuickPickItem = {
        label: formatCodeThemeLabel(variant.label),
        variant,
    };

    if (variant.id === configuredThemeId) {
        item.description = "Current";
    }

    return item;
}

function createQuickPickItems(
    variants: readonly CodeThemeVariant[],
    configuredThemeId: string,
): readonly CodeThemeQuickPickItem[] {
    const builtInItems = variants
        .filter((variant) => variant.source === "builtIn")
        .map((variant) => createQuickPickItem(variant, configuredThemeId));
    const userItems = variants
        .filter((variant) => variant.source === "user")
        .map((variant) => createQuickPickItem(variant, configuredThemeId));
    const items = [createSeparator("mK Coding Extension"), ...builtInItems];

    if (userItems.length > 0) {
        items.push(createSeparator("User Themes"), ...userItems);
    }

    return items;
}

function createSeparator(label: string): CodeThemeQuickPickItem {
    return {
        kind: vscode.QuickPickItemKind.Separator,
        label,
        variant: {
            id: "",
            label,
            source: "builtIn",
            tokenColors: [],
            semanticTokenColors: {},
        },
    };
}

type CodeThemePreviewState = {
    accepted: boolean;
    currentPreviewId: string;
    pendingPreviewId: string;
    timer: NodeJS.Timeout | undefined;
};

function schedulePreview(
    variant: CodeThemeVariant | undefined,
    previewState: CodeThemePreviewState,
): void {
    if (!variant || variant.id.length === 0 || variant.id === previewState.currentPreviewId) {
        return;
    }

    previewState.pendingPreviewId = variant.id;
    clearPreviewTimer(previewState);
    previewState.timer = setTimeout(() => {
        previewState.timer = undefined;

        if (previewState.pendingPreviewId !== variant.id) {
            return;
        }

        previewState.currentPreviewId = variant.id;
        logExtensionDebug("Code Theme", `Previewing code theme "${variant.label}".`);
        void applyCodeThemeVariant(variant);
    }, previewDebounceMilliseconds);
}

function clearPreviewTimer(previewState: CodeThemePreviewState): void {
    if (!previewState.timer) {
        return;
    }

    clearTimeout(previewState.timer);
    previewState.timer = undefined;
}

function formatCodeThemeLabel(label: string): string {
    return label.replace(/^mK Theme (Dark|Dimmed|Light)\s*/, "").trim() || label;
}
