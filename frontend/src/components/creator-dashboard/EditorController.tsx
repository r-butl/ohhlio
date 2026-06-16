import React from 'react';
import { useEditorStore } from "../../context/EditorStore";

import PreviewButton from "@/components/buttons/Preview";
import NavMenuButton from "@/components/buttons/NavMenuButton";

import UndoButton from "../buttons/Undo";
import RedoButton from "../buttons/Redo";
import PublishButton from "../buttons/Publish";
import AddContentButton from "../buttons/AddContentItem";
import { useIsMobile } from "@/hooks/useMobile";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorControllerProps {
    isHomeUser: boolean;
    page?: 'ProjectView' | 'ProfileOverview';
}

const EditorController: React.FC<EditorControllerProps> = ({ isHomeUser, page = 'ProjectView' }) => {
    const viewState = useEditorStore(state => state.viewState);
    const isMobileView = useEditorStore(state => state.isMobileView);
    const enterMobileView = useEditorStore(state => state.enterMobileView);
    const exitMobileView = useEditorStore(state => state.exitMobileView);
    const isMobile = useIsMobile();

    const showToggle = isHomeUser && (viewState === 'OwnerEdit' || isMobileView);

    return (
        <div className="editor-controller h-11 flex items-center px-2">
            <div className="grid grid-cols-3 w-full items-center">
                <div className="flex items-center gap-2">
                    {isHomeUser ? (
                        <SidebarTrigger className="size-7" />
                    ) : (
                        <NavMenuButton />
                    )}

                    {(viewState === 'OwnerEdit' && page === 'ProjectView' && !isMobileView) && (
                        <>
                            <UndoButton />
                            <RedoButton />
                            <AddContentButton />
                        </>
                    )}
                </div>

                <div className="flex items-center justify-center">
                    {showToggle && (
                        <div className="relative flex items-center h-7 rounded border bg-muted p-0.5">
                            <div className={cn(
                                "absolute inset-0.5 w-[calc(50%-1px)] rounded-sm bg-background shadow-sm transition-transform duration-150",
                                isMobileView && "translate-x-[calc(100%+2px)]"
                            )} />
                            <button
                                onClick={exitMobileView}
                                className="relative z-10 flex items-center justify-center size-6"
                                aria-label="Desktop view"
                            >
                                <Monitor className="size-3.5" />
                            </button>
                            <button
                                onClick={enterMobileView}
                                className="relative z-10 flex items-center justify-center size-6"
                                aria-label="Mobile view"
                            >
                                <Smartphone className="size-3.5" />
                            </button>
                        </div>
                    )}
                </div>


                <div className="flex items-center justify-end gap-2">
                    {showToggle && !isMobileView && page === 'ProjectView' && viewState === 'OwnerEdit' && (
                        <PublishButton />
                    )}
                    {(viewState === 'OwnerEdit' || viewState === 'OwnerPreview') && !isMobileView && page === 'ProjectView' && (
                        <PreviewButton isHomeUser={isHomeUser} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditorController;