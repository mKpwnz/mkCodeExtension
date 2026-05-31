import * as vscode from "vscode";

const maxScannedLineCount = 20000;
const colorPattern =
    /(?<![\w-])(?:#[0-9a-fA-F]{3,8}\b|rgba?\(\s*[^)\r\n]{1,80}\)|hsla?\(\s*[^)\r\n]{1,80}\))/g;

let activeDecorationType: vscode.TextEditorDecorationType | undefined;
const enabledDocumentUris = new Set<string>();
const automaticallyEnabledDocumentUris = new Set<string>();

export function activateColorPreview(context: vscode.ExtensionContext): void {
    activeDecorationType = createColorPreviewDecoration();

    context.subscriptions.push(
        activeDecorationType,
        vscode.commands.registerCommand("mkColorPreview.toggleActiveEditor", () =>
            toggleActiveEditor(),
        ),
        vscode.window.onDidChangeVisibleTextEditors(() => updateVisibleEditors()),
        vscode.workspace.onDidChangeTextDocument((event) => updateChangedDocument(event.document)),
        vscode.workspace.onDidCloseTextDocument((document) => disableDocument(document.uri)),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("mkColorPreview")) {
                updateVisibleEditors();
            }
        }),
    );

    updateVisibleEditors();
}

function createColorPreviewDecoration(): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
        before: {
            contentText: "  ",
            border: "1px solid rgba(127, 127, 127, 0.65)",
            margin: "0 0.45em 0 0",
            width: "0.85em",
            height: "0.85em",
        },
    });
}

function toggleActiveEditor(): void {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const key = editor.document.uri.toString();

    if (enabledDocumentUris.has(key)) {
        enabledDocumentUris.delete(key);
        automaticallyEnabledDocumentUris.delete(key);
        clearEditor(editor);
        return;
    }

    enabledDocumentUris.add(key);
    updateEditor(editor);
}

function updateChangedDocument(document: vscode.TextDocument): void {
    if (!enabledDocumentUris.has(document.uri.toString())) {
        return;
    }

    for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === document) {
            updateEditor(editor);
        }
    }
}

function updateVisibleEditors(): void {
    const enabledByDefault = readEnabledByDefaultConfiguration();

    for (const editor of vscode.window.visibleTextEditors) {
        syncAutomaticDocumentState(editor.document.uri, enabledByDefault);

        if (enabledDocumentUris.has(editor.document.uri.toString())) {
            updateEditor(editor);
        } else {
            clearEditor(editor);
        }
    }
}

function disableDocument(uri: vscode.Uri): void {
    const key = uri.toString();

    enabledDocumentUris.delete(key);
    automaticallyEnabledDocumentUris.delete(key);
}

function syncAutomaticDocumentState(uri: vscode.Uri, enabledByDefault: boolean): void {
    const key = uri.toString();

    if (enabledByDefault) {
        enabledDocumentUris.add(key);
        automaticallyEnabledDocumentUris.add(key);
        return;
    }

    if (automaticallyEnabledDocumentUris.has(key)) {
        enabledDocumentUris.delete(key);
        automaticallyEnabledDocumentUris.delete(key);
    }
}

function readEnabledByDefaultConfiguration(): boolean {
    return vscode.workspace.getConfiguration("mkColorPreview").get("enabledByDefault", false);
}

function updateEditor(editor: vscode.TextEditor): void {
    const decorationType = activeDecorationType;

    if (!decorationType) {
        return;
    }

    editor.setDecorations(decorationType, collectColorDecorations(editor.document));
}

function clearEditor(editor: vscode.TextEditor): void {
    const decorationType = activeDecorationType;

    if (!decorationType) {
        return;
    }

    editor.setDecorations(decorationType, []);
}

function collectColorDecorations(document: vscode.TextDocument): vscode.DecorationOptions[] {
    const decorations: vscode.DecorationOptions[] = [];
    const lineCount = Math.min(document.lineCount, maxScannedLineCount);

    for (let lineNumber = 0; lineNumber < lineCount; lineNumber += 1) {
        collectLineColorDecorations(document.lineAt(lineNumber).text, lineNumber, decorations);
    }

    return decorations;
}

function collectLineColorDecorations(
    text: string,
    lineNumber: number,
    decorations: vscode.DecorationOptions[],
): void {
    colorPattern.lastIndex = 0;

    for (const match of text.matchAll(colorPattern)) {
        const colorText = match[0];
        const color = normalizePreviewColor(colorText);

        if (!color) {
            continue;
        }

        const start = match.index;
        const end = start + colorText.length;

        decorations.push({
            range: new vscode.Range(lineNumber, start, lineNumber, end),
            renderOptions: {
                before: {
                    backgroundColor: color,
                },
            },
        });
    }
}

function normalizePreviewColor(value: string): string | undefined {
    if (isValidHexColor(value)) {
        return value;
    }

    if (isValidFunctionalColor(value)) {
        return value;
    }

    return undefined;
}

function isValidHexColor(value: string): boolean {
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

function isValidFunctionalColor(value: string): boolean {
    const match = /^(rgba?|hsla?)\(\s*(?<body>[^)\r\n]{1,80})\)$/i.exec(value);

    if (!match?.groups) {
        return false;
    }

    const colorFunction = match[1]?.toLowerCase();
    const body = match.groups.body;

    if (!colorFunction || !body) {
        return false;
    }

    if (body.includes("/")) {
        return validateSpaceSeparatedColor(colorFunction, body);
    }

    return validateCommaSeparatedColor(colorFunction, body);
}

function validateCommaSeparatedColor(colorFunction: string, body: string): boolean {
    const parts = body.split(",").map((part) => part.trim());
    const requiredPartCount = colorFunction.endsWith("a") ? 4 : 3;

    if (parts.length !== requiredPartCount) {
        return false;
    }

    if (colorFunction.startsWith("rgb")) {
        return (
            parts.slice(0, 3).every(isRgbChannel) &&
            (parts.length === 3 || isAlphaChannel(parts[3] ?? ""))
        );
    }

    return (
        isHueChannel(parts[0] ?? "") &&
        isPercentChannel(parts[1] ?? "") &&
        isPercentChannel(parts[2] ?? "") &&
        (parts.length === 3 || isAlphaChannel(parts[3] ?? ""))
    );
}

function validateSpaceSeparatedColor(colorFunction: string, body: string): boolean {
    const split = body.split("/");

    if (split.length !== 2) {
        return false;
    }

    const channels = split[0]?.trim().split(/\s+/) ?? [];
    const alpha = split[1]?.trim() ?? "";

    if (channels.length !== 3 || !isAlphaChannel(alpha)) {
        return false;
    }

    if (colorFunction.startsWith("rgb")) {
        return channels.every(isRgbChannel);
    }

    return (
        isHueChannel(channels[0] ?? "") &&
        isPercentChannel(channels[1] ?? "") &&
        isPercentChannel(channels[2] ?? "")
    );
}

function isRgbChannel(value: string): boolean {
    if (value.endsWith("%")) {
        return isNumberInRange(value.slice(0, -1), 0, 100);
    }

    return isIntegerInRange(value, 0, 255);
}

function isHueChannel(value: string): boolean {
    const normalized = value.replace(/(?:deg|grad|rad|turn)$/i, "");

    return isFiniteNumber(normalized);
}

function isPercentChannel(value: string): boolean {
    if (!value.endsWith("%")) {
        return false;
    }

    return isNumberInRange(value.slice(0, -1), 0, 100);
}

function isAlphaChannel(value: string): boolean {
    if (value.endsWith("%")) {
        return isNumberInRange(value.slice(0, -1), 0, 100);
    }

    return isNumberInRange(value, 0, 1);
}

function isIntegerInRange(value: string, minimum: number, maximum: number): boolean {
    if (!/^\d+$/.test(value)) {
        return false;
    }

    return isNumberInRange(value, minimum, maximum);
}

function isNumberInRange(value: string, minimum: number, maximum: number): boolean {
    if (!isFiniteNumber(value)) {
        return false;
    }

    const numericValue = Number(value);

    return numericValue >= minimum && numericValue <= maximum;
}

function isFiniteNumber(value: string): boolean {
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(value)) {
        return false;
    }

    return Number.isFinite(Number(value));
}
