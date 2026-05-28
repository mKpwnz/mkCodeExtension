import * as vscode from "vscode";
import type {
    IndicatorStyle,
    ParsedIndentRainbowConfiguration,
} from "@/features/indentRainbow/indentRainbowTypes";
import { clampNumber, readStringArray } from "@/shared/settings";

export function readIndentRainbowConfiguration(): ParsedIndentRainbowConfiguration {
    const configuration = vscode.workspace.getConfiguration("mkIndentRainbow");
    const configuredColors = readStringArray(configuration, "colors");

    return {
        includedLanguages: readStringArray(configuration, "includedLanguages"),
        excludedLanguages: readStringArray(configuration, "excludedLanguages"),
        ignoreErrorLanguages: readStringArray(configuration, "ignoreErrorLanguages"),
        updateDelay: clampNumber(configuration.get("updateDelay"), 0, 2000, 100),
        errorColor: configuration.get("errorColor", "rgba(128,32,32,0.45)"),
        tabmixColor: configuration.get("tabmixColor", "rgba(128,32,96,0.45)"),
        ignoreLinePatterns: readRegExpArray(configuration, "ignoreLinePatterns"),
        colors:
            configuredColors.length > 0
                ? configuredColors
                : [
                      "rgba(73,151,250,0.08)",
                      "rgba(18,184,162,0.08)",
                      "rgba(224,153,45,0.08)",
                      "rgba(134,134,209,0.08)",
                  ],
        colorOnWhiteSpaceOnly: configuration.get("colorOnWhiteSpaceOnly", false),
        indicatorStyle: readIndicatorStyle(configuration),
        lightIndicatorStyleLineWidth: clampNumber(
            configuration.get("lightIndicatorStyleLineWidth"),
            1,
            8,
            1,
        ),
        maxLineCount: clampNumber(configuration.get("maxLineCount"), 100, 100000, 20000),
    };
}

function readRegExpArray(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
): readonly RegExp[] {
    return readStringArray(configuration, key)
        .map((pattern) => parseRegExp(pattern))
        .filter((pattern): pattern is RegExp => pattern !== undefined);
}

function parseRegExp(pattern: string): RegExp | undefined {
    const match = pattern.match(/^\/(.*?)\/([gimuy]*)$/);

    try {
        if (match) {
            return new RegExp(match[1] ?? "", match[2] ?? "");
        }

        return new RegExp(pattern);
    } catch {
        return undefined;
    }
}

function readIndicatorStyle(configuration: vscode.WorkspaceConfiguration): IndicatorStyle {
    const value = configuration.get("indicatorStyle", "classic");

    if (value === "classic" || value === "light") {
        return value;
    }

    return "classic";
}
