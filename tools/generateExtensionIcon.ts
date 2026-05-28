import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { ensureParentDirectory, workspaceRoot } from "./lib/paths";

type Rgba = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
};

const iconSize = 256;
const outputPath = resolve(workspaceRoot, "assets", "extensionIcon.png");
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function createCanvas(): Uint8Array {
    const rowByteLength = 1 + iconSize * 4;
    const canvas = new Uint8Array(rowByteLength * iconSize);

    for (let y = 0; y < iconSize; y += 1) {
        const rowOffset = y * rowByteLength;
        canvas[rowOffset] = 0;

        for (let x = 0; x < iconSize; x += 1) {
            const pixelOffset = rowOffset + 1 + x * 4;
            const vignette = Math.max(0, Math.min(1, distanceFromCenter(x, y) / 180));
            const background = mixColor(
                { red: 26, green: 26, blue: 26, alpha: 255 },
                { red: 10, green: 10, blue: 10, alpha: 255 },
                vignette,
            );

            setPixel(canvas, pixelOffset, background);
        }
    }

    return canvas;
}

function distanceFromCenter(x: number, y: number): number {
    const deltaX = x - iconSize / 2;
    const deltaY = y - iconSize / 2;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function mixColor(left: Rgba, right: Rgba, amount: number): Rgba {
    const clampedAmount = Math.max(0, Math.min(1, amount));

    return {
        red: Math.round(left.red + (right.red - left.red) * clampedAmount),
        green: Math.round(left.green + (right.green - left.green) * clampedAmount),
        blue: Math.round(left.blue + (right.blue - left.blue) * clampedAmount),
        alpha: Math.round(left.alpha + (right.alpha - left.alpha) * clampedAmount),
    };
}

function setPixel(canvas: Uint8Array, offset: number, color: Rgba): void {
    canvas[offset] = color.red;
    canvas[offset + 1] = color.green;
    canvas[offset + 2] = color.blue;
    canvas[offset + 3] = color.alpha;
}

function fillRect(
    canvas: Uint8Array,
    startX: number,
    startY: number,
    width: number,
    height: number,
    color: Rgba,
): void {
    const boundedStartX = Math.max(0, startX);
    const boundedStartY = Math.max(0, startY);
    const endX = Math.min(iconSize, startX + width);
    const endY = Math.min(iconSize, startY + height);
    const rowByteLength = 1 + iconSize * 4;

    for (let y = boundedStartY; y < endY; y += 1) {
        for (let x = boundedStartX; x < endX; x += 1) {
            setPixel(canvas, y * rowByteLength + 1 + x * 4, color);
        }
    }
}

function fillCircle(
    canvas: Uint8Array,
    centerX: number,
    centerY: number,
    radius: number,
    color: Rgba,
): void {
    const startX = Math.max(0, Math.floor(centerX - radius));
    const startY = Math.max(0, Math.floor(centerY - radius));
    const endX = Math.min(iconSize, Math.ceil(centerX + radius));
    const endY = Math.min(iconSize, Math.ceil(centerY + radius));
    const radiusSquared = radius * radius;
    const rowByteLength = 1 + iconSize * 4;

    for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
            const deltaX = x - centerX;
            const deltaY = y - centerY;

            if (deltaX * deltaX + deltaY * deltaY <= radiusSquared) {
                setPixel(canvas, y * rowByteLength + 1 + x * 4, color);
            }
        }
    }
}

function fillPolygon(canvas: Uint8Array, points: Array<[number, number]>, color: Rgba): void {
    const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point[1]))));
    const maxY = Math.min(iconSize - 1, Math.ceil(Math.max(...points.map((point) => point[1]))));
    const rowByteLength = 1 + iconSize * 4;

    for (let y = minY; y <= maxY; y += 1) {
        const intersections: number[] = [];

        for (let index = 0; index < points.length; index += 1) {
            const current = points[index];
            const next = points[(index + 1) % points.length];

            if (!current || !next) {
                throw new Error("Invalid polygon point.");
            }

            const [x1, y1] = current;
            const [x2, y2] = next;

            if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
                intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
            }
        }

        intersections.sort((left, right) => left - right);

        for (let index = 0; index + 1 < intersections.length; index += 2) {
            const startX = Math.max(0, Math.ceil(intersections[index] ?? 0));
            const endX = Math.min(iconSize - 1, Math.floor(intersections[index + 1] ?? 0));

            for (let x = startX; x <= endX; x += 1) {
                setPixel(canvas, y * rowByteLength + 1 + x * 4, color);
            }
        }
    }
}

function drawIcon(canvas: Uint8Array): void {
    const lime: Rgba = { red: 161, green: 251, blue: 26, alpha: 255 };
    const softLime: Rgba = { red: 178, green: 255, blue: 67, alpha: 255 };
    const graphite: Rgba = { red: 37, green: 37, blue: 40, alpha: 255 };

    fillCircle(canvas, 202, 54, 28, { red: 161, green: 251, blue: 26, alpha: 38 });
    fillCircle(canvas, 52, 204, 34, { red: 26, green: 202, blue: 250, alpha: 32 });
    fillRect(canvas, 44, 44, 168, 168, { red: 22, green: 22, blue: 22, alpha: 255 });
    fillRect(canvas, 50, 50, 156, 156, graphite);
    fillRect(canvas, 62, 62, 132, 132, { red: 18, green: 18, blue: 18, alpha: 255 });

    fillRect(canvas, 82, 86, 16, 86, lime);
    fillRect(canvas, 102, 118, 14, 54, lime);
    fillPolygon(
        canvas,
        [
            [96, 86],
            [117, 86],
            [135, 125],
            [120, 125],
        ],
        softLime,
    );
    fillPolygon(
        canvas,
        [
            [138, 86],
            [158, 86],
            [129, 123],
            [158, 172],
            [137, 172],
            [112, 127],
        ],
        lime,
    );
    fillPolygon(
        canvas,
        [
            [158, 124],
            [179, 86],
            [198, 86],
            [174, 128],
            [199, 172],
            [178, 172],
        ],
        softLime,
    );
}

function createChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type, "ascii");
    const lengthBuffer = Buffer.alloc(4);
    const crcBuffer = Buffer.alloc(4);
    const chunkData = Buffer.concat([typeBuffer, data]);

    lengthBuffer.writeUInt32BE(data.length, 0);
    crcBuffer.writeUInt32BE(crc32(chunkData), 0);

    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buffer: Buffer): number {
    let crc = 0xffffffff;

    for (let index = 0; index < buffer.length; index += 1) {
        crc ^= buffer[index] ?? 0;

        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}

function createPng(canvas: Uint8Array): Buffer {
    const header = Buffer.alloc(13);

    header.writeUInt32BE(iconSize, 0);
    header.writeUInt32BE(iconSize, 4);
    header[8] = 8;
    header[9] = 6;
    header[10] = 0;
    header[11] = 0;
    header[12] = 0;

    return Buffer.concat([
        pngSignature,
        createChunk("IHDR", header),
        createChunk("IDAT", deflateSync(canvas)),
        createChunk("IEND", Buffer.alloc(0)),
    ]);
}

const canvas = createCanvas();

drawIcon(canvas);
ensureParentDirectory(outputPath);
writeFileSync(outputPath, createPng(canvas));
console.log(`Wrote ${outputPath}`);
