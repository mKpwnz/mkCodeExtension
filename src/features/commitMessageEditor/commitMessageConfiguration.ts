import * as vscode from "vscode";

export type CommitMessageConfiguration = {
    readonly staticTemplate: readonly string[];
    readonly reduceEmptyLines: boolean;
    readonly saveAndClose: boolean;
    readonly codexGenerationEnabled: boolean;
    readonly codexModel: string;
    readonly codexReasoningEffort: CodexReasoningEffort;
    readonly codexCommand: string;
    readonly hideBuiltInGenerateButton: boolean;
    readonly codexTimeoutSeconds: number;
    readonly codexPrompt: string;
};

export type CodexReasoningEffort = "low" | "medium" | "high";

export const defaultCodexPrompt = [
    "Generate a clear Git commit message for the following diff.",
    "Return only the commit message text. Do not use Markdown fences or explanations.",
    "Use this structure:",
    "1. First line: a Conventional Commit title under 72 characters that names the most important concrete change.",
    "2. Blank line.",
    "3. Body: 2-4 short dash-list items, each under 90 characters.",
    "Each list item must describe one concrete changed file, setting, behavior, or removed code.",
    "Keep the total message concise; prefer specific nouns over vague summary words.",
    "Avoid titles based on cleanup, formatting, updates, changes, or tweaks unless that is the primary change.",
    "",
    "Diff:",
    "{diff}",
].join("\n");

export function readCommitMessageConfiguration(): CommitMessageConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkCommitMessageEditor");

    return {
        staticTemplate: configuration.get("staticTemplate", [
            "feat: Short description",
            "",
            "Message body",
            "",
            "Message footer",
        ]),
        reduceEmptyLines: configuration.get("reduceEmptyLines", true),
        saveAndClose: configuration.get("saveAndClose", false),
        codexGenerationEnabled: configuration.get("codexGenerationEnabled", true),
        codexModel: configuration.get("codexModel", "gpt-5.5"),
        codexReasoningEffort: readCodexReasoningEffort(configuration),
        codexCommand: configuration.get("codexCommand", "codex"),
        hideBuiltInGenerateButton: configuration.get("hideBuiltInGenerateButton", true),
        codexTimeoutSeconds: configuration.get("codexTimeoutSeconds", 120),
        codexPrompt: configuration.get("codexPrompt", defaultCodexPrompt),
    };
}

function readCodexReasoningEffort(
    configuration: vscode.WorkspaceConfiguration,
): CodexReasoningEffort {
    const value = configuration.get<string>("codexReasoningEffort", "low");

    if (value === "medium" || value === "high") {
        return value;
    }

    return "low";
}
