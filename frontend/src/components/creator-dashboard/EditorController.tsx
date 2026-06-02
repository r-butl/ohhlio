import React from 'react';
import { useEditorStore } from "../../context/EditorStore";

import { useSidebar } from "@/components/ui/sidebar";

import PreviewButton from "@/components/buttons/Preview";
import NavMenuButton from "@/components/buttons/NavMenuButton";

import UndoButton from "../buttons/Undo";
import RedoButton from "../buttons/Redo";
import PublishButton from "../buttons/Publish";
import AddContentButton from "../buttons/AddContentItem";
import { useIsMobile } from "@/hooks/use-mobile";

interface EditorControllerProps {
    isHomeUser: boolean;  // This will be used to determine if user is the owner
    page?: 'ProjectView' | 'ProfileOverview';
}

const EditorController: React.FC<EditorControllerProps> = ({ isHomeUser, page = 'ProjectView' }) => {
    const viewState = useEditorStore(state => state.viewState);
    const isMobile = useIsMobile();


    return (
        <div className="editor-controller pt-2 pl-2 pr-2 pb-2">
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {(viewState === 'PublicView' || viewState === 'OwnerPreview') && (
                        <NavMenuButton />
                    )}
                    
                    {(viewState === 'OwnerEdit' && page === 'ProjectView') && (
                        <>
                            <UndoButton />
                            <RedoButton />
                            <AddContentButton />
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isHomeUser && (
                        <>
                            {(viewState === 'OwnerEdit' || viewState === 'OwnerPreview') && (

                                <PreviewButton isHomeUser={isHomeUser} />
                            )}
                            {(page === 'ProjectView') && !isMobile && viewState === 'OwnerEdit' && (
                                <PublishButton />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditorController;