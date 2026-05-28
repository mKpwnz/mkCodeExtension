import * as vscode from "vscode";

type SourceControlInputBox = {
    value: string;
};

type SourceControl = {
    inputBox?: SourceControlInputBox;
};

type GitExtension = {
    getAPI(version: 1): {
        repositories: readonly {
            inputBox: SourceControlInputBox;
        }[];
    };
};

export async function readGitCommitMessage(): Promise<string> {
    return getGitInputBox()?.value ?? "";
}

export async function writeGitCommitMessage(message: string): Promise<void> {
    const inputBox = getGitInputBox();

    if (inputBox) {
        inputBox.value = message;
    }
}

function getGitInputBox(): SourceControlInputBox | undefined {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git")?.exports;
    const repository = gitExtension?.getAPI(1).repositories[0];

    if (repository?.inputBox) {
        return repository.inputBox;
    }

    const sourceControl = vscode.scm.inputBox as SourceControlInputBox | SourceControl;

    if ("value" in sourceControl) {
        return sourceControl;
    }

    return sourceControl.inputBox;
}
