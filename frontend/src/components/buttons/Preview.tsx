import { useEditorStore } from "../../context/EditorStore";
import React from 'react';
import { Button } from "@/components/ui/button";

interface PreviewButtonProps {
    isHomeUser: boolean;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ isHomeUser }) => {
    const mode = useEditorStore(state => state.mode);
    const canEdit = isHomeUser;
    const setEditorMode = useEditorStore(state => state.setEditorMode);
    const activeEditor = useEditorStore(state => state.activeEditor);

    return (
        <div>
            {canEdit && (
                <Button
                    variant="outline" 
                    onClick={() => {
                        setEditorMode(mode === 'edit' ? 'display': 'edit')
                    }}
                    disabled={activeEditor !== null}
                >
                    {mode === 'edit' ? 'Preview' : 'Edit'}
                </Button>
            )}
        </div>

    )
}

export default PreviewButton;
