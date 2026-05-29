import * as vscode from "vscode";

export function getCommitMessageWebviewContent(
    message: string,
    codexGenerationEnabled: boolean,
    accentColor: string,
): string {
    const escapedMessage = escapeHtml(message);
    const escapedAccentColor = escapeHtml(accentColor);
    const codexButton = codexGenerationEnabled
        ? '<button id="generateWithCodex">Generate with Codex</button>'
        : "";

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --mk-accent-color: ${escapedAccentColor};
        }
        body {
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            margin: 0;
            padding: 16px;
        }
        textarea {
            box-sizing: border-box;
            display: block;
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
        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        .codexProgress {
            position: relative;
            overflow: hidden;
            height: 3px;
            margin-top: 8px;
            border-radius: 999px;
            background: color-mix(in srgb, var(--mk-accent-color) 18%, transparent);
            opacity: 0;
            transition: opacity 120ms ease;
        }
        .codexProgress.isGenerating {
            opacity: 1;
        }
        .codexProgress::before {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            left: -35%;
            width: 35%;
            border-radius: inherit;
            background: linear-gradient(
                90deg,
                transparent,
                var(--mk-accent-color),
                transparent
            );
        }
        .codexProgress.isGenerating::before {
            animation: mkProgressSweep 1.15s linear infinite;
        }
        @keyframes mkProgressSweep {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(390%);
            }
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
    <div id="codexProgress" class="codexProgress" aria-hidden="true"></div>
    <div class="actions">
        <button id="save">Save to SCM Input</button>
        <button id="copy">Copy</button>
        ${codexButton}
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const textarea = document.getElementById("message");
        const codexProgress = document.getElementById("codexProgress");
        function setGenerating(isGenerating) {
            codexProgress.classList.toggle("isGenerating", isGenerating);
            if (generateWithCodex) {
                generateWithCodex.disabled = isGenerating;
                generateWithCodex.textContent = isGenerating ? "Generating..." : "Generate with Codex";
            }
        }
        document.getElementById("save").addEventListener("click", () => {
            vscode.postMessage({ command: "save", message: textarea.value });
        });
        document.getElementById("copy").addEventListener("click", () => {
            vscode.postMessage({ command: "copy", message: textarea.value });
        });
        const generateWithCodex = document.getElementById("generateWithCodex");
        if (generateWithCodex) {
            generateWithCodex.addEventListener("click", () => {
                setGenerating(true);
                vscode.postMessage({ command: "generateWithCodex", message: textarea.value });
            });
        }
        window.addEventListener("message", (event) => {
            if (event.data.command === "generatedWithCodex") {
                textarea.value = event.data.message;
            }

            if (
                event.data.command !== "generatedWithCodex" &&
                event.data.command !== "codexGenerationFinished"
            ) {
                return;
            }

            setGenerating(false);
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
