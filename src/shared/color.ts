export const defaultHighlightColor = "#a1fb1a";

export function normalizeHexColor(value: string, fallback: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        return value.toLowerCase();
    }

    return fallback;
}

export function withAlpha(hexColor: string, alphaHex: string): string {
    return `${hexColor}${alphaHex}`;
}
