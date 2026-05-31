import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import * as vscode from "vscode";
import type { PathIntellisenseConfiguration } from "@/features/pathIntellisense/pathIntellisenseConfiguration";

const maxDirectoryEntries = 512;
const workspaceFolderToken = "$" + "{workspaceFolder}";
const pathPattern = /(?:from\s+|import\s*\(|require\s*\(|url\(|["'`])([^"'`]*)$/;

export class PathCompletionProvider implements vscode.CompletionItemProvider {
    public constructor(private readonly readConfiguration: () => PathIntellisenseConfiguration) {}

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.CompletionItem[] {
        const linePrefix = document.lineAt(position).text.slice(0, position.character);
        const match = linePrefix.match(pathPattern);

        if (!match?.[1]) {
            return [];
        }

        const rawPath = match[1];
        const configuration = this.readConfiguration();

        if (!configuration.enabled) {
            return [];
        }

        const directoryPath = resolveCompletionDirectory(document, rawPath, configuration);

        if (!directoryPath || !existsSync(directoryPath)) {
            return [];
        }

        return createCompletionItems(directoryPath, configuration);
    }
}

function resolveCompletionDirectory(
    document: vscode.TextDocument,
    rawPath: string,
    configuration: PathIntellisenseConfiguration,
): string | undefined {
    for (const [alias, target] of Object.entries(configuration.mappings)) {
        if (rawPath.startsWith(alias)) {
            const workspaceFolder =
                vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? "";
            const mappedTarget = target.replace(workspaceFolderToken, workspaceFolder);
            const remainder = rawPath.slice(alias.length);

            return resolve(mappedTarget, dirname(remainder));
        }
    }

    if (rawPath.startsWith("./") || rawPath.startsWith("../")) {
        return resolve(dirname(document.uri.fsPath), dirname(rawPath));
    }

    if (isAbsolute(rawPath)) {
        return resolve(dirname(rawPath));
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;

    return workspaceFolder ? resolve(workspaceFolder, dirname(rawPath)) : undefined;
}

function createCompletionItems(
    directoryPath: string,
    configuration: PathIntellisenseConfiguration,
): vscode.CompletionItem[] {
    const entries = readdirSync(directoryPath, { withFileTypes: true }).slice(
        0,
        maxDirectoryEntries,
    );
    const items: vscode.CompletionItem[] = [];

    for (const entry of entries) {
        if (!configuration.showHiddenFiles && entry.name.startsWith(".")) {
            continue;
        }

        const fullPath = join(directoryPath, entry.name);
        const isDirectory = entry.isDirectory();
        const label = isDirectory ? `${entry.name}/` : entry.name;
        const insertText = getInsertText(entry.name, fullPath, isDirectory, configuration);
        const item = new vscode.CompletionItem(
            label,
            isDirectory ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File,
        );

        item.insertText = insertText;
        item.detail = isDirectory ? "Directory" : "File";
        item.sortText = `${isDirectory ? "0" : "1"}_${entry.name}`;
        items.push(item);
    }

    return items;
}

function getInsertText(
    entryName: string,
    fullPath: string,
    isDirectory: boolean,
    configuration: PathIntellisenseConfiguration,
): string {
    if (isDirectory) {
        return configuration.autoSlashAfterDirectory
            ? `${entryName}${sep}`.replaceAll("\\", "/")
            : entryName;
    }

    if (configuration.extensionOnImport) {
        return entryName;
    }

    const extensionIndex = entryName.lastIndexOf(".");

    if (extensionIndex <= 0 || isLikelyAsset(fullPath)) {
        return entryName;
    }

    return entryName.slice(0, extensionIndex);
}

function isLikelyAsset(path: string): boolean {
    if (!existsSync(path) || !statSync(path).isFile()) {
        return false;
    }

    return /\.(png|jpg|jpeg|gif|svg|webp|json|css|scss|sass|less|ttf|woff2?)$/i.test(path);
}
