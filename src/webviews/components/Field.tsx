import type { ReactElement } from "react";

type FieldProps = {
    readonly htmlFor: string;
    readonly label: string;
    readonly children: ReactElement;
};

export function Field({ htmlFor, label, children }: FieldProps): ReactElement {
    return (
        <label className="grid gap-1.25 text-xs text-vscode-muted" htmlFor={htmlFor}>
            {label}
            {children}
        </label>
    );
}
