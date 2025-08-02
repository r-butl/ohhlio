import React from 'react';
import { useEditorStore } from "../../context/EditorStore";
import { useNavigate, Link } from "react-router-dom";

import {
  useSidebar
} from "@/components/ui/sidebar";

import PreviewButton from "@/components/buttons/Preview";

import UndoButton from "../buttons/Undo";
import RedoButton from "../buttons/Redo";
import PublishButton from "../buttons/Publish";
import AddContentButton from "../buttons/AddContentItem";

interface EditorHeaderProps {
    isHomeUser: boolean;  // This will be used to determine if user is the owner
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ isHomeUser }) => {
    const mode = useEditorStore(state => state.mode);
    const sidebarOpen = useSidebar().open;
    const setEditorMode = useEditorStore(state => state.setEditorMode);

    React.useEffect(() => {
        if (sidebarOpen) {
            setEditorMode('edit');
        } else {
            setEditorMode('display');
        }
    }, [sidebarOpen, setEditorMode]);


    return (
        <div className="editor-header pt-2 pl-2 pr-2 pb-2">
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    
                    {mode === "edit" && (
                        <>
                            <UndoButton />
                            <RedoButton />
                            <AddContentButton />
                        </>
                    )}

                </div>
                <div className="flex items-center gap-2">
                    <PreviewButton isHomeUser={isHomeUser} />
                    <PublishButton />
                </div>
            </div>
        </div>
    );
}

export default EditorHeader;