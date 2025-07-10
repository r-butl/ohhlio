import { useEditorStore } from "../../context/EditorStore";
import React from 'react';
import { Button } from "@/components/ui/button";

interface PreviewButtonProps {
    isHomeUser: boolean;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ isHomeUser }) => {
    const mode = useEditorStore(state => state.mode);
    const canEdit = isHomeUser;
    const toggleEditorMode = useEditorStore(state => state.toggleEditorMode);
    const activeEditor = useEditorStore(state => state.activeEditor);

    return (
        <div>
            {canEdit && (
                <Button
                    variant="outline" 
                    onClick={toggleEditorMode}
                    disabled={activeEditor !== null}
                >
                    {mode === 'edit' ? 'Preview' : 'Edit'}
                </Button>
            )}
        </div>

    )
}

export default PreviewButton;