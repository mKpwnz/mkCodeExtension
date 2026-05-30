import { useCallback, useEffect, useRef, useState } from "react";
import type { ColorPickerValue } from "@/components/ColorPicker";
import { postMessage, subscribeToHostMessages } from "@/services/vscode";
import type { HighlightColorManagerState, SystemAccentColor, UserAccentColor } from "@/types";
import {
    createDefaultUserColorName,
    createSelectedColor,
    hexColorPattern,
    hexToRgb,
    normalizeColor,
    readUserColors,
    systemColorToSelection,
    userColorToSelection,
} from "./colorUtils";
import type { HighlightColorHostMessage, SelectedColor } from "./types";

export type HighlightColorEditorModel = {
    readonly error: string;
    readonly hasUserSelection: boolean;
    readonly isSystemSelection: boolean;
    readonly pickerValue: ColorPickerValue;
    readonly selectedColor: SelectedColor;
    readonly systemColors: readonly SystemAccentColor[];
    readonly userColors: readonly UserAccentColor[];
    readonly close: () => void;
    readonly deleteColor: () => void;
    readonly handlePickerChange: (value: ColorPickerValue) => void;
    readonly renameColor: () => void;
    readonly saveColor: () => void;
    readonly startNewColor: () => void;
    readonly selectSystemColor: (color: SystemAccentColor) => void;
    readonly selectUserColor: (color: UserAccentColor) => void;
};

export function useHighlightColorEditor(
    state: HighlightColorManagerState,
): HighlightColorEditorModel {
    const [userColors, setUserColors] = useState<readonly UserAccentColor[]>(state.userColors);
    const [selectedColor, setSelectedColor] = useState<SelectedColor>(() =>
        createSelectedColor(state.initialColor, state.systemColors, state.userColors),
    );
    const [pickerValue, setPickerValue] = useState<ColorPickerValue>(() => ({
        color: selectedColor.color,
        label: selectedColor.label,
        valid: hexColorPattern.test(selectedColor.color),
    }));
    const [error, setError] = useState("");
    const skippedInitialPreview = useRef(false);
    const hasUserSelection = selectedColor.source === "user" && selectedColor.id.length > 0;
    const isSystemSelection = selectedColor.source === "system";

    const selectColor = useCallback(
        (color: string, nextUserColors = userColors): void => {
            setSelectedColor(createSelectedColor(color, state.systemColors, nextUserColors));
            setError("");
        },
        [state.systemColors, userColors],
    );

    useEffect(() => {
        return subscribeToHostMessages<HighlightColorHostMessage>((message) => {
            handleHostMessage(message, {
                selectedColor,
                selectColor,
                setError,
                setSelectedColor,
                setUserColors,
                userColors,
            });
        });
    }, [selectColor, selectedColor, userColors]);

    useEffect(() => {
        postMessage({ command: "requestCurrentAccent" });
    }, []);

    useEffect(() => {
        updatePickerCssVariables(pickerValue.color);

        if (!skippedInitialPreview.current) {
            skippedInitialPreview.current = true;
            return;
        }

        const timer = window.setTimeout(() => {
            if (pickerValue.valid) {
                postMessage({ command: "preview", color: pickerValue.color });
            }
        }, state.previewDebounceMilliseconds);

        return () => window.clearTimeout(timer);
    }, [pickerValue, state.previewDebounceMilliseconds]);

    return {
        error,
        hasUserSelection,
        isSystemSelection,
        pickerValue,
        selectedColor,
        systemColors: state.systemColors,
        userColors,
        close: () => postMessage({ command: "close" }),
        deleteColor: () => postMessage({ command: "delete", id: selectedColor.id }),
        handlePickerChange: (value) => {
            setPickerValue(value);
            setError(value.valid ? "" : "Use a six-digit hex color like #a1fb1a.");
        },
        renameColor: () =>
            postMessage({
                command: "rename",
                id: selectedColor.id,
                label: pickerValue.label.trim() || "Custom Highlight",
            }),
        saveColor: () => {
            if (!pickerValue.valid || isSystemSelection) {
                return;
            }

            postMessage({
                command: "save",
                color: pickerValue.color,
                id: hasUserSelection ? selectedColor.id : "",
                label: pickerValue.label.trim() || createDefaultUserColorName(userColors),
            });
        },
        selectSystemColor: (color) => {
            setSelectedColor(systemColorToSelection(color));
            postMessage({ command: "applySystem", id: color.id });
        },
        selectUserColor: (color) => {
            setSelectedColor(userColorToSelection(color));
            postMessage({ command: "apply", color: color.color });
        },
        startNewColor: () =>
            setSelectedColor({
                color: selectedColor.color,
                id: "",
                label: createDefaultUserColorName(userColors),
                source: "custom",
            }),
    };
}

type HostMessageContext = {
    readonly selectedColor: SelectedColor;
    readonly selectColor: (color: string, userColors?: readonly UserAccentColor[]) => void;
    readonly setError: (value: string) => void;
    readonly setSelectedColor: (value: SelectedColor) => void;
    readonly setUserColors: (value: readonly UserAccentColor[]) => void;
    readonly userColors: readonly UserAccentColor[];
};

function handleHostMessage(message: HighlightColorHostMessage, context: HostMessageContext): void {
    if (message.command === "nameRejected" && typeof message.label === "string") {
        context.setError(`A user highlight color named "${message.label}" already exists.`);
        return;
    }

    if (message.command === "currentAccentChanged") {
        const nextColor =
            typeof message.color === "string"
                ? normalizeColor(message.color)
                : context.selectedColor.color;
        const nextUserColors = Array.isArray(message.userColors)
            ? readUserColors(message.userColors)
            : context.userColors;

        context.setUserColors(nextUserColors);
        context.selectColor(nextColor, nextUserColors);
        return;
    }

    if (message.command !== "colorsChanged" || !Array.isArray(message.colors)) {
        return;
    }

    const nextUserColors = readUserColors(message.colors);
    const nextCurrentColor =
        typeof message.currentColor === "string"
            ? normalizeColor(message.currentColor)
            : context.selectedColor.color;

    context.setUserColors(nextUserColors);

    if (typeof message.selectedId === "string" && message.selectedId.length > 0) {
        const selectedUserColor = nextUserColors.find((color) => color.id === message.selectedId);

        if (selectedUserColor) {
            context.setSelectedColor(userColorToSelection(selectedUserColor));
            return;
        }
    }

    context.selectColor(nextCurrentColor, nextUserColors);
}

function updatePickerCssVariables(color: string): void {
    const [red, green, blue] = hexToRgb(color);

    document.documentElement.style.setProperty("--picker-color", color);
    document.documentElement.style.setProperty("--picker-r", String(red));
    document.documentElement.style.setProperty("--picker-g", String(green));
    document.documentElement.style.setProperty("--picker-b", String(blue));
}
