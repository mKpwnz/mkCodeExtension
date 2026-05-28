import * as vscode from "vscode";

export function getCommitMessageWebviewContent(message: string): string {
    const escapedMessage = escapeHtml(message);

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            margin: 0;
            padding: 16px;
        }
        textarea {
            box-sizing: border-box;
            width: 100%;
            min-height: 280px;
            resize: vertical;
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.5;
            padding: 12px;
        }
        .actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        button {
            border: 1px solid var(--vscode-button-border, transparent);
            border-radius: 5px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            padding: 6px 12px;
        }
    </style>
</head>
<body>
    <textarea id="message" spellcheck="true">${escapedMessage}</textarea>
    <div class="actions">
        <button id="save">Save to SCM Input</button>
        <button id="copy">Copy</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const textarea = document.getElementById("message");
        document.getElementById("save").addEventListener("click", () => {
            vscode.postMessage({ command: "save", message: textarea.value });
        });
        document.getElementById("copy").addEventListener("click", () => {
            vscode.postMessage({ command: "copy", message: textarea.value });
        });
    </script>
</body>
</html>`;
}

export function reduceEmptyLines(message: string): string {
    return message.replaceAll(/\n{3,}/g, "\n\n").replace(/\n+$/g, "");
}

export function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

export async function copyText(message: string): Promise<void> {
    await vscode.env.clipboard.writeText(message);
}
