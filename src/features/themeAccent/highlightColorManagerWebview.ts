import type * as vscode from "vscode";
import type { AccentPreset } from "@/features/themeAccent/accentPresets";
import type { UserAccentColor } from "@/features/themeAccent/userAccentColors";
import { defaultHighlightColor, normalizeHexColor } from "@/shared/color";
import { createNonce, createReactWebviewHtml } from "@/shared/reactWebviewHtml";

export type HighlightColorManagerInitialState = {
    readonly currentColor: string;
    readonly initialColor: string;
    readonly systemColors: readonly AccentPreset[];
    readonly userColors: readonly UserAccentColor[];
    readonly previewDebounceMilliseconds: number;
};

type HighlightColorManagerWebviewOptions = {
    readonly extensionUri: vscode.Uri;
    readonly webview: vscode.Webview;
    readonly nonce: string;
    readonly state: HighlightColorManagerInitialState;
};

export function createHighlightColorManagerHtml(
    options: HighlightColorManagerWebviewOptions,
): string {
    return createReactWebviewHtml({
        extensionUri: options.extensionUri,
        loadingLabel: "Loading highlight color manager...",
        nonce: options.nonce,
        state: {
            ...options.state,
            route: "highlightColorManager",
            currentColor: normalizeHexColor(options.state.currentColor, defaultHighlightColor),
            initialColor: normalizeHexColor(options.state.initialColor, defaultHighlightColor),
        },
        title: "Manage Custom Highlight Colors",
        webview: options.webview,
    });
}

export { createNonce };
