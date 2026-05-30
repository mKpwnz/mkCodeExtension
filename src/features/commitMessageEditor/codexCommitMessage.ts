import type { ChildProcess } from "node:child_process";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";
import type { CommitMessageConfiguration } from "@/features/commitMessageEditor/commitMessageConfiguration";
import {
    logExtensionError,
    logExtensionInfo,
    logExtensionWarn,
    showExtensionOutput,
} from "@/shared/extensionLogger";

const execFileAsync = promisify(execFile);
const featureName = "Commit Message Editor";
const maxDiffBytes = 60000;

export async function generateCodexCommitMessage(
    configuration: CommitMessageConfiguration,
    cancellationToken: vscode.CancellationToken,
): Promise<string> {
    showExtensionOutput();
    logExtensionInfo(featureName, "Starting Codex commit message generation.");
    const workspacePath = getWorkspacePath();
    logExtensionInfo(
        featureName,
        `Running Codex commit message with model ${configuration.codexModel} and reasoning effort ${configuration.codexReasoningEffort}.`,
    );

    const diffResult = await readCommitDiff(workspacePath);

    if (diffResult.diff.length === 0) {
        logExtensionWarn(featureName, "No staged or unstaged Git changes found.");
        throw new Error("No staged or unstaged Git changes found.");
    }

    logExtensionInfo(
        featureName,
        `Using ${diffResult.source} diff with ${diffResult.originalLength} characters.`,
    );
    const prompt = createPrompt(configuration.codexPrompt, diffResult.diff);
    const tempDirectory = await mkdtemp(join(tmpdir(), "mk-codex-commit-"));
    const outputPath = join(tempDirectory, "message.txt");
    const args = [
        "exec",
        "--model",
        configuration.codexModel,
        "-c",
        `model_reasoning_effort="${configuration.codexReasoningEffort}"`,
        "--sandbox",
        "read-only",
        "-C",
        workspacePath,
        "-o",
        outputPath,
    ];

    try {
        const processOutput = await runCodexProcess(
            configuration,
            args,
            prompt,
            workspacePath,
            cancellationToken,
        );

        const output = await readFile(outputPath, "utf8");
        const message = cleanCommitMessage(output);

        if (message.length === 0) {
            throw new Error("Codex returned an empty commit message.");
        }

        logTokenUsage(processOutput);
        return message;
    } finally {
        await rm(tempDirectory, { force: true, recursive: true });
    }
}

type CommitDiffResult = {
    readonly diff: string;
    readonly source: "staged" | "unstaged";
    readonly originalLength: number;
};

async function readCommitDiff(workspacePath: string): Promise<CommitDiffResult> {
    logExtensionInfo(featureName, "Reading staged Git diff.");
    const stagedDiff = await readGitDiff(workspacePath, ["diff", "--cached", "--no-ext-diff"]);

    if (stagedDiff.trim().length > 0) {
        return {
            diff: limitDiff(stagedDiff),
            source: "staged",
            originalLength: stagedDiff.length,
        };
    }

    logExtensionInfo(featureName, "No staged diff found. Reading unstaged Git diff.");
    const unstagedDiff = await readGitDiff(workspacePath, ["diff", "--no-ext-diff"]);
    return {
        diff: limitDiff(unstagedDiff),
        source: "unstaged",
        originalLength: unstagedDiff.length,
    };
}

async function readGitDiff(workspacePath: string, args: readonly string[]): Promise<string> {
    try {
        const { stdout } = await execFileAsync("git", [...args], {
            cwd: workspacePath,
            maxBuffer: maxDiffBytes,
            timeout: 30000,
            windowsHide: true,
        });

        return stdout;
    } catch (error) {
        if (error instanceof Error && "stdout" in error && typeof error.stdout === "string") {
            return error.stdout;
        }

        throw error;
    }
}

function getWorkspacePath(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
        throw new Error("Open a workspace folder before generating a commit message.");
    }

    return workspaceFolder.uri.fsPath;
}

function createPrompt(template: string, diff: string): string {
    if (template.includes("{diff}")) {
        return template.replaceAll("{diff}", diff);
    }

    return `${template.trimEnd()}\n\nDiff:\n${diff}`;
}

function limitDiff(diff: string): string {
    if (diff.length <= maxDiffBytes) {
        return diff;
    }

    logExtensionWarn(
        featureName,
        `Diff truncated from ${diff.length} to ${maxDiffBytes} characters.`,
    );
    return `${diff.slice(0, maxDiffBytes)}\n\n[Diff truncated]`;
}

function cleanCommitMessage(value: string): string {
    return value
        .replaceAll(/^```(?:gitcommit|text)?\s*/gim, "")
        .replaceAll(/```\s*$/gim, "")
        .trim();
}

function runCodexProcess(
    configuration: CommitMessageConfiguration,
    args: readonly string[],
    prompt: string,
    workspacePath: string,
    cancellationToken: vscode.CancellationToken,
): Promise<ProcessOutput> {
    return new Promise((resolve, reject) => {
        const child = spawn(configuration.codexCommand, [...args], {
            cwd: workspacePath,
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true,
        });
        let stdoutLength = 0;
        let stderrLength = 0;
        const stdoutChunks: string[] = [];
        const stderrChunks: string[] = [];
        let settled = false;
        let cancelled = false;
        let timedOut = false;
        const timeoutMs = Math.max(1, configuration.codexTimeoutSeconds) * 1000;
        const timeout = setTimeout(() => {
            if (settled) {
                return;
            }

            timedOut = true;
            terminateProcess(child);
            logExtensionError(featureName, "Codex process timed out and was terminated.");
        }, timeoutMs);
        const cancellation = cancellationToken.onCancellationRequested(() => {
            if (settled) {
                return;
            }

            cancelled = true;
            terminateProcess(child);
            clearTimeout(timeout);
            logExtensionWarn(featureName, "Codex process was cancelled and terminated.");
        });

        child.stdin.on("error", (error) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timeout);
            cancellation.dispose();
            logExtensionError(featureName, `Failed to write Codex prompt: ${error.message}`);
            reject(error);
        });
        child.stdin.end(prompt);

        child.stdout.on("data", (chunk: Buffer) => {
            stdoutLength += chunk.length;
            collectProcessOutput(stdoutChunks, chunk, stdoutLength);
        });

        child.stderr.on("data", (chunk: Buffer) => {
            stderrLength += chunk.length;
            collectProcessOutput(stderrChunks, chunk, stderrLength);
        });

        child.on("error", (error) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timeout);
            cancellation.dispose();
            logExtensionError(featureName, `Failed to start Codex process: ${error.message}`);
            reject(error);
        });

        child.on("close", (code, signal) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timeout);
            cancellation.dispose();
            logExtensionInfo(featureName, `Codex process exited with code ${code ?? "null"}.`);

            if (timedOut) {
                reject(new Error(`Codex timed out after ${configuration.codexTimeoutSeconds}s.`));
                return;
            }

            if (cancelled) {
                reject(new Error("Codex commit message generation was cancelled."));
                return;
            }

            if (signal) {
                logBufferedProcessOutput(stderrChunks, "stderr", "warn");
                reject(new Error(`Codex process exited with signal ${signal}.`));
                return;
            }

            if (code !== 0) {
                logBufferedProcessOutput(stderrChunks, "stderr", "error");
                logBufferedProcessOutput(stdoutChunks, "stdout", "info");
                reject(new Error(`Codex process exited with code ${code ?? "null"}.`));
                return;
            }

            resolve({
                stderr: stderrChunks.join("\n"),
                stdout: stdoutChunks.join("\n"),
            });
        });
    });
}

type ProcessOutput = {
    readonly stderr: string;
    readonly stdout: string;
};

function collectProcessOutput(chunks: string[], chunk: Buffer, totalLength: number): void {
    if (totalLength > maxDiffBytes) {
        return;
    }

    const value = chunk.toString("utf8").trimEnd();

    if (value.length > 0) {
        chunks.push(value);
    }
}

function logBufferedProcessOutput(
    chunks: readonly string[],
    stream: "stdout" | "stderr",
    level: "info" | "warn" | "error",
): void {
    const value = chunks.join("\n").trim();

    if (value.length === 0) {
        return;
    }

    const filtered = filterCodexOutput(value);

    if (filtered.length === 0) {
        return;
    }

    const log =
        level === "error"
            ? logExtensionError
            : level === "warn"
              ? logExtensionWarn
              : logExtensionInfo;
    log(featureName, `[codex ${stream}]\n${filtered}`);
}

function logTokenUsage(output: ProcessOutput): void {
    const combinedOutput = `${output.stderr}\n${output.stdout}`;
    const tokens = readTokenUsage(combinedOutput);

    if (tokens.length === 0) {
        logExtensionInfo(featureName, "Finished Codex commit message generation.");
        return;
    }

    logExtensionInfo(featureName, `Used ${tokens} tokens for the commit message.`);
}

function readTokenUsage(output: string): string {
    const lines = output.replaceAll("\r\n", "\n").split("\n");

    for (let index = 0; index < lines.length; index += 1) {
        if (lines[index]?.trim() !== "tokens used") {
            continue;
        }

        const nextLine = lines[index + 1]?.trim() ?? "";

        if (/^[0-9]+([.,][0-9]+)?$/.test(nextLine)) {
            return nextLine;
        }
    }

    return "";
}

function filterCodexOutput(value: string): string {
    const lines = value.replaceAll("\r\n", "\n").split("\n");
    const filtered: string[] = [];
    let skipPromptEcho = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === "user") {
            skipPromptEcho = true;
            continue;
        }

        if (skipPromptEcho) {
            if (trimmed === "codex" || trimmed === "tokens used") {
                skipPromptEcho = false;
            } else {
                continue;
            }
        }

        if (
            trimmed.length === 0 ||
            trimmed === "codex" ||
            trimmed === "tokens used" ||
            trimmed === "Reading additional input from stdin..." ||
            trimmed.startsWith("OpenAI Codex ") ||
            trimmed.startsWith("workdir:") ||
            trimmed.startsWith("model:") ||
            trimmed.startsWith("provider:") ||
            trimmed.startsWith("approval:") ||
            trimmed.startsWith("sandbox:") ||
            trimmed.startsWith("reasoning effort:") ||
            trimmed.startsWith("reasoning summaries:") ||
            trimmed.startsWith("session id:") ||
            /^[-]{4,}$/.test(trimmed) ||
            /^[0-9]+([.,][0-9]+)?$/.test(trimmed)
        ) {
            continue;
        }

        filtered.push(line);
    }

    return filtered.join("\n").trim();
}

function terminateProcess(child: ChildProcess): void {
    if (!child.pid) {
        child.kill();
        return;
    }

    if (process.platform === "win32") {
        execFile(
            "taskkill",
            ["/pid", child.pid.toString(), "/t", "/f"],
            { windowsHide: true },
            () => {
                return;
            },
        );
        return;
    }

    child.kill("SIGTERM");
}
