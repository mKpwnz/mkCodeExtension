import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/TextArea";
import { postMessage, subscribeToHostMessages } from "@/services/vscode";
import type { CommitMessageEditorState } from "@/types";

type HostMessage = {
    readonly command?: unknown;
    readonly message?: unknown;
};

type CommitMessageEditorRouteProps = {
    readonly state: CommitMessageEditorState;
};

export function CommitMessageEditorRoute({ state }: CommitMessageEditorRouteProps): ReactElement {
    const [message, setMessage] = useState(state.initialMessage);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        return subscribeToHostMessages<HostMessage>((hostMessage) => {
            if (
                hostMessage.command === "generatedWithCodex" &&
                typeof hostMessage.message === "string"
            ) {
                setMessage(hostMessage.message);
                setIsGenerating(false);
                return;
            }

            if (hostMessage.command === "codexGenerationFinished") {
                setIsGenerating(false);
            }
        });
    }, []);

    function sendMessage(command: "copy" | "generateWithCodex" | "save"): void {
        if (command === "generateWithCodex") {
            setIsGenerating(true);
        }

        postMessage({ command, message });
    }

    return (
        <main className="grid gap-3 p-4">
            <TextArea
                spellCheck={true}
                value={message}
                onChange={(event) => setMessage(event.currentTarget.value)}
            />
            <div
                aria-hidden="true"
                className="codex-progress bg-accent-muted relative h-0.75 overflow-hidden rounded-full opacity-0 transition-opacity data-[generating=true]:opacity-100"
                data-generating={isGenerating}
            />
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => sendMessage("save")}>Save to SCM Input</Button>
                <Button variant="secondary" onClick={() => sendMessage("copy")}>
                    Copy
                </Button>
                {state.codexGenerationEnabled ? (
                    <Button
                        variant="secondary"
                        disabled={isGenerating}
                        onClick={() => sendMessage("generateWithCodex")}
                    >
                        {isGenerating ? "Generating..." : "Generate with Codex"}
                    </Button>
                ) : null}
            </div>
        </main>
    );
}
