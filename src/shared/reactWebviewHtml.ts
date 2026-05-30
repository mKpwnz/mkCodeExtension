import * as vscode from "vscode";

type ReactWebviewHtmlOptions = {
    readonly extensionUri: vscode.Uri;
    readonly loadingLabel: string;
    readonly nonce: string;
    readonly state: unknown;
    readonly title: string;
    readonly webview: vscode.Webview;
};

export function createReactWebviewHtml(options: ReactWebviewHtmlOptions): string {
    const scriptUri = options.webview.asWebviewUri(
        vscode.Uri.joinPath(options.extensionUri, "assets", "webviews", "webviewApp.js"),
    );
    const styleUri = options.webview.asWebviewUri(
        vscode.Uri.joinPath(options.extensionUri, "assets", "webviews", "webviewApp.css"),
    );
    const initialState = JSON.stringify(options.state).replace(/</g, "\\u003c");
    const cspContent = [
        "default-src 'none'",
        `style-src ${options.webview.cspSource} 'unsafe-inline'`,
        `script-src ${options.webview.cspSource} 'nonce-${options.nonce}'`,
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${escapeAttribute(cspContent)}">
    <link rel="stylesheet" href="${escapeAttribute(styleUri.toString())}">
    <title>${escapeHtml(options.title)}</title>
</head>
<body>
    <div id="root">
        <main style="padding: 16px; color: var(--vscode-foreground); font-family: var(--vscode-font-family);">
            ${escapeHtml(options.loadingLabel)}
        </main>
    </div>
    <script nonce="${escapeAttribute(options.nonce)}">
        window.__MK_WEBVIEW_STATE__ = ${initialState};
        const root = document.getElementById("root");

        function escapeHtml(value) {
            return String(value).replace(/[&<>]/g, function (character) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;"
                }[character];
            });
        }

        function showError(message) {
            if (!root) {
                return;
            }

            root.innerHTML = "<main style=\\"padding: 16px; color: var(--vscode-errorForeground); font-family: var(--vscode-font-family);\\">" +
                escapeHtml(message) +
                "</main>";
        }

        window.addEventListener("error", function (event) {
            showError("Failed to load ${escapeScriptString(options.title)}: " + event.message);
        });

        const script = document.createElement("script");
        script.nonce = "${escapeScriptString(options.nonce)}";
        script.src = "${escapeScriptString(scriptUri.toString())}";
        script.onerror = function () {
            showError("Failed to load webviewApp.js from extension assets.");
        };
        document.body.appendChild(script);
    </script>
</body>
</html>`;
}

export function createNonce(): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nonce = "";

    for (let index = 0; index < 32; index += 1) {
        nonce += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return nonce;
}

function escapeAttribute(value: string): string {
    return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeScriptString(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\u003c");
}
