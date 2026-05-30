import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { CommitMessageEditorRoute } from "@/routes/commitMessageEditor/CommitMessageEditor";
import { HighlightColorManagerRoute } from "@/routes/highlightColorManager/HighlightColorEditor";
import { getInitialState } from "@/services/vscode";
import type { WebviewInitialState } from "@/types";

declare global {
    interface Window {
        readonly __MK_WEBVIEW_STATE__?: WebviewInitialState;
    }
}

function App(): ReactElement {
    const state = getInitialState();

    switch (state?.route) {
        case "commitMessageEditor":
            return <CommitMessageEditorRoute state={state} />;
        case "highlightColorManager":
            return <HighlightColorManagerRoute state={state} />;
        default:
            return <main className="webview-fallback">Unknown webview route.</main>;
    }
}

const root = document.getElementById("root");

if (root) {
    createRoot(root).render(<App />);
}
