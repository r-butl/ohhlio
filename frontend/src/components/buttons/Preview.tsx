import { useEditorStore } from "../../context/EditorStore";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

import {
    useSidebar
  } from "@/components/ui/sidebar";

interface PreviewButtonProps {
    isHomeUser: boolean;
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ isHomeUser }) => {
    const mode = useEditorStore(state => state.mode);
    const sidebarOpen = useSidebar().open;
    const toggleSidebar = useSidebar().toggleSidebar;
    const setEditorMode = useEditorStore(state => state.setEditorMode);

    React.useEffect(() => {
        if (sidebarOpen) {
            setEditorMode('edit');
        } else {
            setEditorMode('display');
        }
    }, [sidebarOpen, setEditorMode]);

    return (
        <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(event) => {
            toggleSidebar()
            }}
        >
            {mode === "display" ? <Square /> : <Play /> }
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
        )

}

export default PreviewButton;
