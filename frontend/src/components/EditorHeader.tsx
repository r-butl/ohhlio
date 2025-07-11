import React from 'react';
import { useEditorStore } from "../context/EditorStore";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import {
  SidebarTrigger,
} from "@/components/ui/sidebar";

import UndoButton from "./buttons/undo";
import RedoButton from "./buttons/redo";
import PreviewButton from "./buttons/preview";
import PublishButton from "./buttons/publish";
import AddContentButton from "./buttons/AddContentItem";

interface EditorHeaderProps {
    isHomeUser: boolean;  // This will be used to determine if user is the owner
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ isHomeUser }) => {
    const navigate = useNavigate();

    return (
        <div className="editor-header">
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <UndoButton />
                    <RedoButton />
                    <AddContentButton />
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