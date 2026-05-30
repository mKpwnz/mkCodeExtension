declare module "*.css";

import type { VsCodeApi, WebviewInitialState } from "@/types";

declare global {
    interface Window {
        readonly acquireVsCodeApi: () => VsCodeApi;
        readonly __MK_WEBVIEW_STATE__?: WebviewInitialState;
    }
}
