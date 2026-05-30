import type { ReactElement, ReactNode } from "react";

type SidebarProps = {
    readonly children: ReactNode;
    readonly title: string;
};

type SidebarSectionProps = {
    readonly action?: ReactElement;
    readonly children: ReactNode;
    readonly title: string;
};

export function Sidebar({ children, title }: SidebarProps): ReactElement {
    return (
        <aside className="grid min-h-0 grid-rows-[auto_1fr] border-vscode-sidebar-border border-r bg-vscode-sidebar px-2 py-2.5 max-[760px]:border-r-0 max-[760px]:border-b">
            <div className="flex h-7.5 items-center px-0.5 pb-2">
                <h1 className="m-0 text-[13px] font-semibold">{title}</h1>
            </div>
            <div className="min-h-0 overflow-y-auto pr-1">{children}</div>
        </aside>
    );
}

export function SidebarSection({ action, children, title }: SidebarSectionProps): ReactElement {
    return (
        <div className="grid gap-px pb-3">
            <div className="flex min-h-7 items-center justify-between gap-2 px-1.5 py-1">
                <h2 className="m-0 text-[11px] font-semibold tracking-normal text-vscode-muted uppercase">
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </div>
    );
}
