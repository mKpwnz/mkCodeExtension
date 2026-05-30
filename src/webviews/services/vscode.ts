import type { VsCodeApi, WebviewHostMessage, WebviewInitialState } from "@/types";

const vscodeApi: VsCodeApi = window.acquireVsCodeApi();

export function getInitialState(): WebviewInitialState | undefined {
    return window.__MK_WEBVIEW_STATE__;
}

export function postMessage(message: WebviewHostMessage): void {
    vscodeApi.postMessage(message);
}

export function subscribeToHostMessages<TMessage>(
    handler: (message: TMessage) => void,
): () => void {
    const listener = (event: MessageEvent<TMessage>): void => {
        handler(event.data);
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
}
