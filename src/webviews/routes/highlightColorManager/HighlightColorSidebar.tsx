import type { ReactElement } from "react";
import { Button } from "@/components/Button";
import { Sidebar, SidebarSection } from "@/components/Sidebar";
import type { SystemAccentColor, UserAccentColor } from "@/types";

type HighlightColorSidebarProps = {
    readonly selectedId: string;
    readonly selectedSource: "custom" | "system" | "user";
    readonly systemColors: readonly SystemAccentColor[];
    readonly userColors: readonly UserAccentColor[];
    readonly onAddColor: () => void;
    readonly onSelectSystemColor: (color: SystemAccentColor) => void;
    readonly onSelectUserColor: (color: UserAccentColor) => void;
};

export function HighlightColorSidebar({
    selectedId,
    selectedSource,
    systemColors,
    userColors,
    onAddColor,
    onSelectSystemColor,
    onSelectUserColor,
}: HighlightColorSidebarProps): ReactElement {
    return (
        <Sidebar title="Custom Highlight Colors">
            <SidebarSection title="System Colors">
                {systemColors.map((systemColor) => (
                    <ColorListButton
                        key={systemColor.id}
                        active={systemColor.id === selectedId && selectedSource === "system"}
                        color={systemColor.color}
                        label={systemColor.label}
                        onClick={() => onSelectSystemColor(systemColor)}
                    />
                ))}
            </SidebarSection>
            <SidebarSection
                title="User Colors"
                action={
                    <Button
                        id="addButton"
                        title="Add custom highlight color"
                        variant="icon"
                        onClick={onAddColor}
                    >
                        +
                    </Button>
                }
            >
                {userColors.length === 0 ? (
                    <div className="rounded-[5px] bg-vscode-list-inactive p-3 text-vscode-muted">
                        No saved user highlight colors.
                    </div>
                ) : (
                    userColors.map((userColor) => (
                        <ColorListButton
                            key={userColor.id}
                            active={userColor.id === selectedId && selectedSource === "user"}
                            color={userColor.color}
                            label={userColor.label}
                            onClick={() => onSelectUserColor(userColor)}
                        />
                    ))
                )}
            </SidebarSection>
        </Sidebar>
    );
}

type ColorListButtonProps = {
    readonly active: boolean;
    readonly color: string;
    readonly label: string;
    readonly onClick: () => void;
};

function ColorListButton({ active, color, label, onClick }: ColorListButtonProps): ReactElement {
    return (
        <button
            type="button"
            className={
                active
                    ? "grid min-h-7 w-full cursor-pointer grid-cols-[18px_1fr_auto] items-center gap-2 rounded-[5px] border border-accent bg-vscode-list-active px-1.5 py-0.75 text-left text-vscode-list-active-foreground"
                    : "grid min-h-7 w-full cursor-pointer grid-cols-[18px_1fr_auto] items-center gap-2 rounded-[5px] border border-transparent bg-transparent px-1.5 py-0.75 text-left text-vscode-list-foreground hover:bg-vscode-list-hover"
            }
            onClick={onClick}
        >
            <span
                className="h-3.5 w-3.5 rounded-[3px] border border-vscode-widget-border"
                style={{ background: color }}
            />
            <span>{label}</span>
            <span>{color}</span>
        </button>
    );
}
