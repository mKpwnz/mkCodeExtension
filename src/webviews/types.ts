export type WebviewRoute = "commitMessageEditor" | "highlightColorManager";

export type UserAccentColor = {
    readonly id: string;
    readonly label: string;
    readonly color: string;
};

export type SystemAccentColor = {
    readonly id: string;
    readonly label: string;
    readonly color: string;
};

export type HighlightColorManagerState = {
    readonly route: "highlightColorManager";
    readonly currentColor: string;
    readonly initialColor: string;
    readonly systemColors: readonly SystemAccentColor[];
    readonly userColors: readonly UserAccentColor[];
    readonly previewDebounceMilliseconds: number;
};

export type CommitMessageEditorState = {
    readonly route: "commitMessageEditor";
    readonly codexGenerationEnabled: boolean;
    readonly initialMessage: string;
};

export type WebviewInitialState = CommitMessageEditorState | HighlightColorManagerState;

export type WebviewHostMessage =
    | {
          readonly command: "copy" | "generateWithCodex" | "save";
          readonly message: string;
      }
    | {
          readonly command: "preview" | "apply";
          readonly color: string;
      }
    | {
          readonly command: "requestCurrentAccent";
      }
    | {
          readonly command: "save";
          readonly color: string;
          readonly id?: string;
          readonly label: string;
      }
    | {
          readonly command: "rename";
          readonly id: string;
          readonly label: string;
      }
    | {
          readonly command: "delete";
          readonly id: string;
      }
    | {
          readonly command: "applySystem";
          readonly id: string;
      }
    | {
          readonly command: "close";
      };

export type VsCodeApi = {
    readonly postMessage: (message: WebviewHostMessage) => void;
};
