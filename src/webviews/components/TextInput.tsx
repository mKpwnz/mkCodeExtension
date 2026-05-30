import type { InputHTMLAttributes, ReactElement } from "react";
import { cn } from "@/utils/utils";

export function TextInput({
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement>): ReactElement {
    return (
        <input
            {...props}
            className={cn(
                `
                    box-border h-6.5 w-full rounded-[5px]
                    border border-vscode-input-border bg-vscode-input
                    px-1.5 py-0.75 text-vscode-input-foreground
                    outline-none transition-colors
                    hover:border-accent
                    focus:border-accent focus:outline focus:outline-1
                    focus:-outline-offset-1 focus:outline-accent
                    disabled:opacity-65
                `,
                className,
            )}
        />
    );
}
