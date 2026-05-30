import type { ReactElement } from "react";
import { Button } from "@/components/Button";
import { ColorPicker } from "@/components/ColorPicker";
import type { HighlightColorManagerState } from "@/types";
import { HighlightColorSidebar } from "./HighlightColorSidebar";
import { useHighlightColorEditor } from "./useHighlightColorEditor";

type HighlightColorManagerRouteProps = {
    readonly state: HighlightColorManagerState;
};

export function HighlightColorManagerRoute({
    state,
}: HighlightColorManagerRouteProps): ReactElement {
    const editor = useHighlightColorEditor(state);

    return (
        <main className="grid h-screen min-h-0 overflow-hidden grid-cols-[minmax(260px,340px)_minmax(430px,1fr)] max-[760px]:grid-cols-1">
            <HighlightColorSidebar
                selectedId={editor.selectedColor.id}
                selectedSource={editor.selectedColor.source}
                systemColors={editor.systemColors}
                userColors={editor.userColors}
                onAddColor={editor.startNewColor}
                onSelectSystemColor={editor.selectSystemColor}
                onSelectUserColor={editor.selectUserColor}
            />
            <section className="min-h-0 overflow-y-auto p-4.5">
                <div className="grid content-start gap-3.5">
                    <h2 className="m-0 text-xs font-semibold text-vscode-muted uppercase">
                        Color Editor
                    </h2>
                    <ColorPicker
                        key={`${editor.selectedColor.source}:${editor.selectedColor.id}:${editor.selectedColor.color}`}
                        disabled={editor.isSystemSelection}
                        hexInputId="highlightColorHex"
                        initialName={editor.selectedColor.label}
                        initialValue={editor.selectedColor.color}
                        nameInputId="highlightColorName"
                        onChange={editor.handlePickerChange}
                    />
                    <div className="min-h-4.5 max-w-200 text-vscode-error">{editor.error}</div>
                    <div className="flex max-w-200 flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            disabled={editor.error.length > 0 || editor.isSystemSelection}
                            onClick={editor.saveColor}
                        >
                            Save Color
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={
                                !editor.hasUserSelection ||
                                editor.error.length > 0 ||
                                editor.isSystemSelection
                            }
                            onClick={editor.renameColor}
                        >
                            Rename
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={!editor.hasUserSelection}
                            onClick={editor.deleteColor}
                        >
                            Delete
                        </Button>
                        <Button variant="secondary" onClick={editor.close}>
                            Close
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
