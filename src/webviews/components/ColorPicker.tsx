import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Field } from "@/components/Field";
import { RangeInput } from "@/components/RangeInput";
import { TextInput } from "@/components/TextInput";

const hexPattern = /^#[0-9a-fA-F]{6}$/;

type ColorPickerProps = {
    readonly disabled?: boolean;
    readonly hexInputId: string;
    readonly initialName?: string;
    readonly initialValue: string;
    readonly nameInputId?: string;
    readonly nameLabel?: string;
    readonly nameMaxLength?: number;
    readonly onChange: (value: ColorPickerValue) => void;
};

export type ColorPickerValue = {
    readonly color: string;
    readonly label: string;
    readonly valid: boolean;
};

export function ColorPicker({
    disabled = false,
    hexInputId,
    initialName = "",
    initialValue,
    nameInputId,
    nameLabel = "Name",
    nameMaxLength = 80,
    onChange,
}: ColorPickerProps): ReactElement {
    const [color, setColor] = useState(normalizeColor(initialValue));
    const [label, setLabel] = useState(initialName);
    const [red, green, blue] = hexToRgb(color);
    const hasNameInput = typeof nameInputId === "string";

    useEffect(() => {
        setColor(normalizeColor(initialValue));
        setLabel(initialName);
    }, [initialName, initialValue]);

    useEffect(() => {
        onChange({
            color,
            label,
            valid: hexPattern.test(color),
        });
    }, [color, label, onChange]);

    function updateRgb(nextRed: number, nextGreen: number, nextBlue: number): void {
        setColor(rgbToHex(nextRed, nextGreen, nextBlue));
    }

    return (
        <div className="grid max-w-[800px] grid-cols-[170px_minmax(320px,1fr)] gap-5 rounded-md border border-vscode-widget-border bg-vscode-editor-widget p-3.5 max-[760px]:grid-cols-1">
            <div className="grid content-start gap-2.5">
                <div className="aspect-square w-full rounded-lg border border-vscode-widget-border bg-picker" />
                <Field htmlFor={hexInputId} label="Hex">
                    <TextInput
                        id={hexInputId}
                        type="text"
                        value={color}
                        maxLength={7}
                        spellCheck={false}
                        disabled={disabled}
                        onChange={(event) => setColor(normalizeColor(event.currentTarget.value))}
                    />
                </Field>
            </div>
            <div className="grid gap-2.5">
                {hasNameInput ? (
                    <Field htmlFor={nameInputId ?? ""} label={nameLabel}>
                        <TextInput
                            id={nameInputId}
                            type="text"
                            value={label}
                            maxLength={nameMaxLength}
                            disabled={disabled}
                            onChange={(event) => setLabel(event.currentTarget.value)}
                        />
                    </Field>
                ) : undefined}
                <ColorChannel
                    channel="R"
                    value={red}
                    disabled={disabled}
                    onChange={(nextRed) => updateRgb(nextRed, green, blue)}
                />
                <ColorChannel
                    channel="G"
                    value={green}
                    disabled={disabled}
                    onChange={(nextGreen) => updateRgb(red, nextGreen, blue)}
                />
                <ColorChannel
                    channel="B"
                    value={blue}
                    disabled={disabled}
                    onChange={(nextBlue) => updateRgb(red, green, nextBlue)}
                />
            </div>
        </div>
    );
}

function normalizeColor(value: string): string {
    return value.trim().toLowerCase();
}

type ColorChannelProps = {
    readonly channel: "R" | "G" | "B";
    readonly disabled: boolean;
    readonly value: number;
    readonly onChange: (value: number) => void;
};

function ColorChannel({ channel, disabled, value, onChange }: ColorChannelProps): ReactElement {
    const rangeChannel = channel === "R" ? "red" : channel === "G" ? "green" : "blue";

    return (
        <div className="grid grid-cols-[18px_1fr_64px] items-center gap-2.5">
            <span className="text-right font-semibold text-vscode-muted">{channel}</span>
            <RangeInput
                channel={rangeChannel}
                disabled={disabled}
                value={value}
                onChange={(event) => onChange(clampChannel(event.currentTarget.value))}
            />
            <TextInput
                type="number"
                disabled={disabled}
                min={0}
                max={255}
                value={value}
                onChange={(event) => onChange(clampChannel(event.currentTarget.value))}
            />
        </div>
    );
}

function hexToRgb(value: string): readonly [number, number, number] {
    if (!hexPattern.test(value)) {
        return [0, 0, 0];
    }

    return [
        Number.parseInt(value.slice(1, 3), 16),
        Number.parseInt(value.slice(3, 5), 16),
        Number.parseInt(value.slice(5, 7), 16),
    ];
}

function rgbToHex(red: number, green: number, blue: number): string {
    return `#${[red, green, blue]
        .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
        .join("")}`;
}

function clampChannel(value: string | number): number {
    const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        return 0;
    }

    return Math.min(255, Math.max(0, parsed));
}
