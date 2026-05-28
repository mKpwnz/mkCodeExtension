import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type JsonValue, readJsonFile, writeJsonFile } from "./lib/json";
import { assertPathExists, upstreamRoot, workspaceRoot } from "./lib/paths";

type ElegantTheme = {
    colors: Record<string, string>;
};

const upstreamThemePath = resolve(
    upstreamRoot,
    "elegant-theme",
    "resources",
    "theme",
    "elegant-dark.theme.json",
);
const upstreamSchemePath = resolve(
    upstreamRoot,
    "elegant-theme",
    "resources",
    "theme",
    "elegant-dark.theme.xml",
);
const targetThemePath = resolve(workspaceRoot, "themes", "mk-theme-dark-color-theme.json");

assertPathExists(upstreamThemePath, "ElegantTheme JSON");
assertPathExists(upstreamSchemePath, "ElegantTheme editor scheme");

const upstreamTheme = readJsonFile(upstreamThemePath) as ElegantTheme;
const upstreamScheme = readFileSync(upstreamSchemePath, "utf8");

if (!upstreamTheme.colors || upstreamScheme.length < 100) {
    throw new Error("ElegantTheme upstream files are not usable.");
}

const color = (name: string): string => {
    const value = upstreamTheme.colors[name];

    if (!value) {
        throw new Error(`Missing ElegantTheme color: ${name}`);
    }

    return value;
};

const theme: JsonValue = {
    name: "mK Theme Dark",
    type: "dark",
    semanticHighlighting: true,
    colors: {
        "activityBar.background": color("dark"),
        "activityBar.border": color("gray"),
        "activityBar.foreground": color("white"),
        "activityBar.inactiveForeground": color("gray5"),
        "activityBarBadge.background": color("primarySecondary"),
        "activityBarBadge.foreground": color("pureWhite"),
        "badge.background": color("primaryTertiary"),
        "badge.foreground": color("pureWhite"),
        "breadcrumb.activeSelectionForeground": color("pureWhite"),
        "breadcrumb.background": color("editor"),
        "breadcrumb.focusForeground": color("white"),
        "breadcrumb.foreground": color("white2"),
        "button.background": color("primary"),
        "button.foreground": color("pureWhite"),
        "button.hoverBackground": color("primarySecondary"),
        "checkbox.background": color("gray2"),
        "checkbox.border": color("gray3"),
        "commandCenter.background": color("dark"),
        "commandCenter.border": color("gray3"),
        "commandCenter.foreground": color("white"),
        "debugToolBar.background": color("gray2"),
        "dropdown.background": color("dark"),
        "dropdown.border": color("gray"),
        "dropdown.foreground": color("white"),
        "editor.background": color("editor"),
        "editor.findMatchBackground": "#2b2f36",
        "editor.findMatchBorder": "#e0992d",
        "editor.findMatchHighlightBackground": "#2b2f36aa",
        "editor.foreground": "#a7b4c2",
        "editor.lineHighlightBackground": "#24272b",
        "editor.selectionBackground": "#152e4f",
        "editor.wordHighlightBackground": "#40332b",
        "editor.wordHighlightStrongBackground": "#40332b",
        "editorBracketMatch.background": color("gray4"),
        "editorBracketMatch.border": "#ffef28",
        "editorCursor.foreground": "#2075eb",
        "editorGutter.background": color("editor"),
        "editorIndentGuide.activeBackground1": "#2075eb",
        "editorIndentGuide.background1": "#373b42",
        "editorLineNumber.activeForeground": "#a7b4c2",
        "editorLineNumber.foreground": color("gray4"),
        "editorOverviewRuler.border": color("editor"),
        "editorRuler.foreground": "#373b42",
        "editorSuggestWidget.background": color("editor"),
        "editorSuggestWidget.border": color("gray"),
        "editorSuggestWidget.foreground": color("white2"),
        "editorSuggestWidget.highlightForeground": color("primarySecondary"),
        "editorSuggestWidget.selectedBackground": color("gray2"),
        "editorWidget.background": color("editor"),
        "editorWidget.border": color("gray"),
        focusBorder: color("primarySecondary"),
        foreground: color("treeText"),
        "input.background": color("dark"),
        "input.border": color("gray"),
        "input.foreground": color("white"),
        "input.placeholderForeground": color("gray5"),
        "list.activeSelectionBackground": color("primaryTertiary"),
        "list.activeSelectionForeground": color("pureWhite"),
        "list.focusBackground": color("primaryTertiary"),
        "list.hoverBackground": color("gray"),
        "list.inactiveSelectionBackground": color("gray"),
        "list.inactiveSelectionForeground": color("white"),
        "menu.background": color("dark"),
        "menu.foreground": color("white"),
        "menu.selectionBackground": color("primaryTertiary"),
        "notificationCenter.border": color("gray"),
        "notifications.background": color("gray2"),
        "notifications.border": color("gray"),
        "panel.background": color("dark"),
        "panel.border": color("gray"),
        "panelTitle.activeBorder": color("primarySecondary"),
        "panelTitle.activeForeground": color("white"),
        "panelTitle.inactiveForeground": color("gray5"),
        "peekView.border": color("primarySecondary"),
        "peekViewEditor.background": color("editor"),
        "peekViewResult.background": color("dark"),
        "progressBar.background": color("primarySecondary"),
        "scrollbarSlider.activeBackground": color("scrollHoverThumb"),
        "scrollbarSlider.background": color("scrollThumb"),
        "scrollbarSlider.hoverBackground": color("scrollHoverThumb"),
        "sideBar.background": color("dark"),
        "sideBar.border": color("gray"),
        "sideBar.foreground": color("treeText"),
        "sideBarSectionHeader.background": color("dark"),
        "sideBarSectionHeader.border": color("gray"),
        "sideBarTitle.foreground": color("white"),
        "statusBar.background": color("primaryTertiary"),
        "statusBar.foreground": color("pureWhite"),
        "statusBar.noFolderBackground": color("gray2"),
        "tab.activeBackground": color("editor"),
        "tab.activeBorderTop": color("primarySecondary"),
        "tab.activeForeground": color("white"),
        "tab.border": color("gray"),
        "tab.hoverBackground": color("gray"),
        "tab.inactiveBackground": color("editor"),
        "tab.inactiveForeground": color("gray5"),
        "terminal.background": color("editor"),
        "terminal.foreground": "#a7b4c2",
        "terminal.ansiBlue": "#4997fa",
        "terminal.ansiBrightBlue": "#2075eb",
        "terminal.ansiBrightCyan": "#13abc0",
        "terminal.ansiBrightGreen": "#009460",
        "terminal.ansiBrightMagenta": "#d674b9",
        "terminal.ansiBrightRed": "#e80854",
        "terminal.ansiBrightWhite": "#ffffff",
        "terminal.ansiBrightYellow": "#e0992d",
        "terminal.ansiCyan": "#12b8a2",
        "terminal.ansiGreen": "#009460",
        "terminal.ansiMagenta": "#8686d1",
        "terminal.ansiRed": "#db7672",
        "terminal.ansiWhite": "#d0d1da",
        "terminal.ansiYellow": "#eb8800",
        "titleBar.activeBackground": color("dark"),
        "titleBar.activeForeground": color("white"),
        "titleBar.border": color("gray"),
        "titleBar.inactiveBackground": color("dark"),
        "titleBar.inactiveForeground": color("gray5"),
    },
    tokenColors: [
        {
            scope: ["comment", "punctuation.definition.comment"],
            settings: { foreground: "#5b697c", fontStyle: "italic" },
        },
        {
            scope: ["string", "constant.other.symbol"],
            settings: { foreground: "#009963" },
        },
        {
            scope: ["constant.numeric", "constant.language", "support.constant"],
            settings: { foreground: "#eb8800" },
        },
        {
            scope: ["keyword", "storage", "storage.type"],
            settings: { foreground: "#e0992d" },
        },
        {
            scope: ["entity.name.function", "support.function", "meta.function-call"],
            settings: { foreground: "#4997fa" },
        },
        {
            scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
            settings: { foreground: "#12b8a2" },
        },
        {
            scope: ["variable", "variable.other.readwrite"],
            settings: { foreground: "#8686d1" },
        },
        {
            scope: ["variable.parameter", "meta.function.parameters"],
            settings: { foreground: "#13abc0" },
        },
        {
            scope: ["variable.other.property", "support.variable.property"],
            settings: { foreground: "#a7b4c2" },
        },
        {
            scope: ["entity.other.attribute-name", "meta.decorator"],
            settings: { foreground: "#e0992d" },
        },
        {
            scope: ["entity.name.tag", "support.type.property-name"],
            settings: { foreground: "#4997fa" },
        },
        {
            scope: ["invalid", "invalid.illegal"],
            settings: { foreground: "#bc3f3c", fontStyle: "underline" },
        },
    ],
    semanticTokenColors: {
        class: "#12b8a2",
        enum: "#12b8a2",
        function: "#4997fa",
        interface: "#12b8a2",
        keyword: "#e0992d",
        method: "#4997fa",
        namespace: "#e0992d",
        parameter: "#13abc0",
        property: "#a7b4c2",
        string: "#009963",
        type: "#12b8a2",
        typeParameter: "#e0992d",
        variable: "#8686d1",
    },
};

writeJsonFile(targetThemePath, theme);
console.log(`Wrote ${targetThemePath}`);
