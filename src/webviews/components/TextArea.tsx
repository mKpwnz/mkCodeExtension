import type { ReactElement, TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/utils";

export function TextArea({
    className,
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>): ReactElement {
    return (
        <textarea
            {...props}
            className={cn(
                `
                    box-border block min-h-70 w-full resize-y rounded-md
                    border border-vscode-input-border bg-vscode-input
                    p-3 font-vscode-editor text-vscode-input-foreground
                    leading-6 outline-none transition-colors
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
