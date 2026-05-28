import { withAlpha } from "@/shared/color";

const managedAccentKeys = [
    "activityBar.activeBorder",
    "activityBar.activeFocusBorder",
    "activityBar.foreground",
    "activityBarBadge.background",
    "checkbox.selectBorder",
    "commandCenter.activeBorder",
    "editor.snippetFinalTabstopHighlightBorder",
    "editorSuggestWidget.highlightForeground",
    "focusBorder",
    "inputOption.activeBorder",
    "inputOption.activeForeground",
    "link.activeForeground",
    "list.activeSelectionIconForeground",
    "list.focusHighlightForeground",
    "list.focusOutline",
    "list.highlightForeground",
    "notificationLink.foreground",
    "panelTitle.activeBorder",
    "peekView.border",
    "pickerGroup.foreground",
    "progressBar.background",
    "settings.modifiedItemIndicator",
    "statusBarItem.focusBorder",
    "tab.activeBorderTop",
    "tab.activeModifiedBorder",
    "terminal.tab.activeBorder",
    "textLink.activeForeground",
    "textLink.foreground",
] as const;

export function buildAccentColors(accentColor: string): Record<string, string> {
    const accentColors: Record<string, string> = {};

    for (const key of managedAccentKeys) {
        accentColors[key] = accentColor;
    }

    accentColors["activityBar.activeBackground"] = "#171717";
    accentColors["activityBarBadge.foreground"] = "#111111";
    accentColors["editor.rangeHighlightBackground"] = withAlpha(accentColor, "12");
    accentColors["editor.snippetTabstopHighlightBackground"] = withAlpha(accentColor, "1a");
    accentColors["editorUnnecessaryCode.border"] = withAlpha(accentColor, "66");
    accentColors["settings.focusedRowBorder"] = withAlpha(accentColor, "66");

    return accentColors;
}
