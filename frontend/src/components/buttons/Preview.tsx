import { useEditorStore } from "../../context/EditorStore";
import React from 'react';
import { Button } from "@/components/ui/Button";
import { Play, Square } from "lucide-react";

import { useSidebar } from "@/components/ui/Sidebar";

interface PreviewButtonProps {
    isHomeUser: boolean;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ isHomeUser }) => {
    const viewState = useEditorStore(state => state.viewState);
    const togglePreview = useEditorStore(state => state.togglePreview);
    const { open: sidebarOpen, toggleSidebar } = useSidebar();

    return (
        <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(event) => {
            event.preventDefault();
            if (!isHomeUser) return;
            togglePreview();
            // keep sidebar open state unchanged; preview toggles view state
            }}
        >
            {viewState === 'OwnerEdit' ?  <Play />  : <Square />}
            <span className="sr-only">Toggle preview</span>
        </Button>
        )

}

export default PreviewButton;
