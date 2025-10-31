import React from 'react';
import { useEditorStore } from "../../context/EditorStore";

import { useSidebar } from "@/components/ui/sidebar";

import PreviewButton from "@/components/buttons/Preview";

import UndoButton from "../buttons/Undo";
import RedoButton from "../buttons/Redo";
import PublishButton from "../buttons/Publish";
import AddContentButton from "../buttons/AddContentItem";

interface EditorControllerProps {
    isHomeUser: boolean;  // This will be used to determine if user is the owner
}

const EditorController: React.FC<EditorControllerProps> = ({ isHomeUser }) => {
    const viewState = useEditorStore(state => state.viewState);


    return (
        <div className="editor-controller pt-2 pl-2 pr-2 pb-2">
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    
                    {viewState === 'OwnerEdit' && (
                        <>
                            <UndoButton />
                            <RedoButton />
                            <AddContentButton />
                        </>
                    )}

                </div>
                <div className="flex items-center gap-2">
                    {isHomeUser && <PreviewButton isHomeUser={isHomeUser} />}
                    <PublishButton />
                </div>
            </div>
        </div>
    );
}

export default EditorController;