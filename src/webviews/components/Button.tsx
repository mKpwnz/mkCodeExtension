import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/utils/utils";

type ButtonVariant = "primary" | "secondary" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    readonly variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
    primary: `
        border border-vscode-button-border
        bg-vscode-button hover:bg-vscode-button-hover
    `,
    secondary: `
        border border-transparent bg-vscode-button-secondary
        text-vscode-button-secondary-foreground
        hover:bg-vscode-button-secondary-hover
    `,
    icon: `
        h-[26px] w-[26px] min-w-0 p-0
        border border-vscode-button-border bg-vscode-button
        text-base leading-none hover:bg-vscode-button-hover
    `,
};

export function Button({
    className,
    variant = "primary",
    type = "button",
    ...props
}: ButtonProps): ReactElement {
    return (
        <button
            {...props}
            className={cn(
                `
                    inline-flex h-6.5 min-w-18 cursor-pointer
                    items-center justify-center rounded-[5px]
                    px-2.75 py-1 text-vscode-button-foreground
                    outline-none transition-colors
                    focus-visible:outline
                    focus-visible:-outline-offset-1 focus-visible:outline-accent
                    disabled:cursor-default disabled:opacity-45
                `,
                variantClassNames[variant],
                className,
            )}
            type={type}
        />
    );
}
