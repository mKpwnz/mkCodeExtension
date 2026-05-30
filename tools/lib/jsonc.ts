export function parseJsonWithComments<T>(content: string): T {
    return JSON.parse(stripJsonCommentsAndTrailingCommas(content)) as T;
}

function stripJsonCommentsAndTrailingCommas(content: string): string {
    let output = "";
    let inString = false;
    let escaped = false;

    for (let index = 0; index < content.length; index += 1) {
        const current = content[index];
        const next = content[index + 1];

        if (!current) {
            break;
        }

        if (inString) {
            output += current;

            if (escaped) {
                escaped = false;
            } else if (current === "\\") {
                escaped = true;
            } else if (current === '"') {
                inString = false;
            }

            continue;
        }

        if (current === '"') {
            inString = true;
            output += current;
            continue;
        }

        if (current === "/" && next === "/") {
            index = skipLineComment(content, index + 2);
            output += "\n";
            continue;
        }

        if (current === "/" && next === "*") {
            index = skipBlockComment(content, index + 2);
            continue;
        }

        if (current === "," && isTrailingComma(content, index + 1)) {
            continue;
        }

        output += current;
    }

    return output;
}

function skipLineComment(content: string, index: number): number {
    for (let cursor = index; cursor < content.length; cursor += 1) {
        if (content[cursor] === "\n") {
            return cursor;
        }
    }

    return content.length;
}

function skipBlockComment(content: string, index: number): number {
    for (let cursor = index; cursor + 1 < content.length; cursor += 1) {
        if (content[cursor] === "*" && content[cursor + 1] === "/") {
            return cursor + 1;
        }
    }

    return content.length;
}

function isTrailingComma(content: string, index: number): boolean {
    for (let cursor = index; cursor < content.length; cursor += 1) {
        const current = content[cursor];

        if (!current) {
            return false;
        }

        if (current === " " || current === "\t" || current === "\r" || current === "\n") {
            continue;
        }

        return current === "}" || current === "]";
    }

    return false;
}
