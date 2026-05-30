import { defaultHighlightColor, normalizeHexColor } from "@/shared/color";

export const customPreset = "custom";
export const accentSettingSection = "mkTheme";
export const accentPresetKey = "highlightPreset";
export const accentColorKey = "highlightColor";

export type AccentPreset = {
    readonly id: string;
    readonly label: string;
    readonly color: string;
};

export const accentPresets: readonly AccentPreset[] = [
    { id: "azure", label: "Azure", color: "#0792f1" },
    { id: "graphite", label: "Graphite", color: "#323239" },
    { id: "silver", label: "Silver", color: "#efeff1" },
    { id: "green", label: "Green", color: "#17bf6b" },
    { id: "lime", label: "Lime", color: defaultHighlightColor },
    { id: "amber", label: "Amber", color: "#ffc632" },
    { id: "red", label: "Red", color: "#e91916" },
    { id: "coral", label: "Coral", color: "#fa7342" },
    { id: "yellow", label: "Yellow", color: "#fbd91a" },
    { id: "cyan", label: "Cyan", color: "#1acafa" },
    { id: "violet", label: "Violet", color: "#8270fa" },
    { id: "magenta", label: "Magenta", color: "#da5dfa" },
    { id: "pink", label: "Pink", color: "#fb477e" },
    { id: customPreset, label: "Custom", color: defaultHighlightColor },
];

const presetColors = new Map(accentPresets.map((preset) => [preset.id, preset.color]));

export function resolveAccentColor(preset: string, customColor: string): string {
    if (preset !== customPreset) {
        return presetColors.get(preset) ?? defaultHighlightColor;
    }

    return normalizeHexColor(customColor, defaultHighlightColor);
}
