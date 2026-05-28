import { defaultHighlightColor, normalizeHexColor } from "@/shared/color";

export const customPreset = "custom";
export const accentSettingSection = "mkTheme";
export const accentPresetKey = "highlightPreset";
export const accentColorKey = "highlightColor";

const presetColors = new Map<string, string>([
    ["azure", "#0792f1"],
    ["graphite", "#323239"],
    ["silver", "#efeff1"],
    ["green", "#17bf6b"],
    ["lime", defaultHighlightColor],
    ["amber", "#ffc632"],
    ["red", "#e91916"],
    ["coral", "#fa7342"],
    ["yellow", "#fbd91a"],
    ["cyan", "#1acafa"],
    ["violet", "#8270fa"],
    ["magenta", "#da5dfa"],
    ["pink", "#fb477e"],
    [customPreset, defaultHighlightColor],
]);

export function resolveAccentColor(preset: string, customColor: string): string {
    if (preset !== customPreset) {
        return presetColors.get(preset) ?? defaultHighlightColor;
    }

    return normalizeHexColor(customColor, defaultHighlightColor);
}
