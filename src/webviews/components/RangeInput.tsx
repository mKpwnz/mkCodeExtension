import type { InputHTMLAttributes, ReactElement } from "react";
import { cn } from "@/utils/utils";

type RangeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "max" | "min" | "type"> & {
    readonly channel: "red" | "green" | "blue";
};

export function RangeInput({ channel, className, ...props }: RangeInputProps): ReactElement {
    const channelClassName = getChannelClassName(channel);

    return (
        <input
            {...props}
            className={cn("range-input", channelClassName, className)}
            max={255}
            min={0}
            type="range"
        />
    );
}

function getChannelClassName(channel: RangeInputProps["channel"]): string {
    if (channel === "red") {
        return "range-red";
    }

    if (channel === "green") {
        return "range-green";
    }

    return "range-blue";
}
