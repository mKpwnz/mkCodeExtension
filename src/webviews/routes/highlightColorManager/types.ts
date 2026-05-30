import type { SystemAccentColor, UserAccentColor } from "@/types";

export type HighlightColorHostMessage = {
    readonly command?: unknown;
    readonly colors?: unknown;
    readonly color?: unknown;
    readonly currentColor?: unknown;
    readonly label?: unknown;
    readonly selectedId?: unknown;
    readonly userColors?: unknown;
};

export type SelectedColor = {
    readonly color: string;
    readonly id: string;
    readonly label: string;
    readonly source: "custom" | "system" | "user";
};

export type HighlightColorEditorState = {
    readonly selectedColor: SelectedColor;
    readonly systemColors: readonly SystemAccentColor[];
    readonly userColors: readonly UserAccentColor[];
};
